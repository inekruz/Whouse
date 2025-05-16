const db = require('../../../db');
const WarehouseMath = require('./warehouseMath');

class WarehouseMathService {
    // Обновляет ABC-анализ для всех товаров
    static async updateABCAnalysis() {
        try {
            // Получаем все товары с их стоимостью
            const query = `
                SELECT p.id, p.name, p.quantity, p.price, p.category_id
                FROM wh_products p
                ORDER BY (p.quantity * p.price) DESC
            `;
            const result = await db.query(query);
            
            if (!result.rows.length) return;
            
            // Выполняем ABC-анализ
            const abcResult = WarehouseMath.analyzeABC(result.rows);
            
            // Удаляем старые данные анализа
            await db.query('DELETE FROM wh_abc_analysis');
            
            // Сохраняем новые данные
            for (const category of ['A', 'B', 'C']) {
                for (const product of abcResult[category]) {
                    await db.query(
                        'INSERT INTO wh_abc_analysis (product_id, category) VALUES ($1, $2)',
                        [product.id, category]
                    );
                }
            }
            
            return abcResult;
        } catch (error) {
            console.error('Error in ABC analysis update:', error);
            throw error;
        }
    }

    // Обновляет прогнозы остатков для всех товаров
    static async updateInventoryForecasts(days = 7) {
        try {
            // Получаем все товары
            const products = await db.query('SELECT id FROM wh_products');
            
            // Удаляем старые прогнозы
            await db.query('DELETE FROM wh_inventory_forecasts');
            
            // Для каждого товара получаем историю и строим прогноз
            for (const product of products.rows) {
                const history = await db.query(
                    `SELECT date, quantity 
                     FROM wh_inventory_history 
                     WHERE product_id = $1 
                     ORDER BY date DESC 
                     LIMIT 30`, // Берем последние 30 записей
                    [product.id]
                );
                
                if (history.rows.length > 1) {
                    const forecast = WarehouseMath.forecastInventory(
                        history.rows.reverse(), // Переворачиваем для правильного порядка
                        days
                    );
                    
                    // Сохраняем прогноз
                    for (const day of forecast) {
                        await db.query(
                            `INSERT INTO wh_inventory_forecasts 
                             (product_id, forecast_date, predicted_quantity) 
                             VALUES ($1, $2, $3)`,
                            [product.id, day.date, day.predictedQuantity]
                        );
                    }
                }
            }
        } catch (error) {
            console.error('Error in inventory forecasts update:', error);
            throw error;
        }
    }

    // Обновляет ключевые показатели (KPI) для всех товаров
    static async updateProductKPIs() {
        try {
            // Получаем статистику по продажам/перемещениям
            const stats = await db.query(`
                SELECT 
                    product_id,
                    AVG(quantity) as avg_daily_demand,
                    MAX(quantity) as max_daily_demand,
                    STDDEV(quantity) as demand_stddev
                FROM wh_transfers
                WHERE transfer_date > CURRENT_DATE - INTERVAL '90 days'
                GROUP BY product_id
            `);
            
            // Получаем данные о времени поставки
            const leadTimeStats = await db.query(`
                SELECT 
                    product_id,
                    AVG(EXTRACT(DAY FROM (received_date - ordered_date))) as avg_lead_time,
                    MAX(EXTRACT(DAY FROM (received_date - ordered_date))) as max_lead_time,
                    STDDEV(EXTRACT(DAY FROM (received_date - ordered_date))) as lead_time_stddev
                FROM wh_purchase_orders
                WHERE received_date IS NOT NULL
                GROUP BY product_id
            `);
            
            // Получаем данные о стоимости заказа и хранения
            const costData = await db.query(`
                SELECT 
                    product_id,
                    ordering_cost,
                    holding_cost
                FROM wh_product_costs
            `);
            
            // Создаем мапы для быстрого доступа
            const leadTimeMap = leadTimeStats.rows.reduce((acc, row) => {
                acc[row.product_id] = row;
                return acc;
            }, {});
            
            const costMap = costData.rows.reduce((acc, row) => {
                acc[row.product_id] = row;
                return acc;
            }, {});
            
            // Обновляем KPI для каждого товара
            for (const stat of stats.rows) {
                const leadTime = leadTimeMap[stat.product_id] || {
                    avg_lead_time: 5,
                    max_lead_time: 10,
                    lead_time_stddev: 2
                };
                
                const costs = costMap[stat.product_id] || {
                    ordering_cost: 50,
                    holding_cost: 2
                };
                
                // Расчет страхового запаса
                const safetyStock = WarehouseMath.calculateSafetyStock(
                    stat.avg_daily_demand,
                    stat.demand_stddev,
                    leadTime.avg_lead_time,
                    leadTime.lead_time_stddev
                );
                
                // Расчет точки заказа
                const reorderPoint = WarehouseMath.calculateReorderPoint(
                    leadTime.avg_lead_time,
                    stat.avg_daily_demand,
                    safetyStock
                );
                
                // Расчет экономичного объема заказа (EOQ)
                const eoq = WarehouseMath.calculateEOQ(
                    stat.avg_daily_demand * 365, // Годовой спрос
                    costs.ordering_cost,
                    costs.holding_cost
                );
                
                // Рассчитываем оборачиваемость
                const turnoverRate = await this.calculateTurnoverRate(stat.product_id);
                
                // Обновляем или вставляем запись
                await db.query(`
                    INSERT INTO wh_product_kpis 
                    (product_id, reorder_point, safety_stock, turnover_rate, eoq)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (product_id) 
                    DO UPDATE SET
                        reorder_point = EXCLUDED.reorder_point,
                        safety_stock = EXCLUDED.safety_stock,
                        turnover_rate = EXCLUDED.turnover_rate,
                        eoq = EXCLUDED.eoq,
                        last_calculated = CURRENT_TIMESTAMP
                `, [stat.product_id, reorderPoint, safetyStock, turnoverRate, eoq]);
            }
        } catch (error) {
            console.error('Error in product KPIs update:', error);
            throw error;
        }
    }

    // Рассчитывает оборачиваемость товара
    static async calculateTurnoverRate(productId, periodDays = 30) {
        try {
            // Получаем данные о продажах и средних запасах
            const result = await db.query(`
                WITH sales AS (
                    SELECT COALESCE(SUM(quantity), 0) as total_sold
                    FROM wh_transfers
                    WHERE product_id = $1
                    AND transfer_date > CURRENT_DATE - INTERVAL '${periodDays} days'
                    AND transfer_type = 'outgoing'
                ),
                inventory AS (
                    SELECT COALESCE(AVG(quantity), 0) as avg_inventory
                    FROM wh_inventory_history
                    WHERE product_id = $1
                    AND date > CURRENT_DATE - INTERVAL '${periodDays} days'
                )
                SELECT 
                    total_sold,
                    avg_inventory,
                    CASE 
                        WHEN avg_inventory > 0 THEN total_sold / avg_inventory
                        ELSE 0 
                    END as turnover_rate
                FROM sales, inventory
            `, [productId]);
            
            return result.rows[0]?.turnover_rate || 0;
        } catch (error) {
            console.error('Error calculating turnover rate:', error);
            return 0;
        }
    }

    // Статистика по локациям (откуда)
    static async getSourceLocationStats() {
        try {
            const result = await db.query(`
                SELECT 
                    from_location as location,
                    COUNT(*) as transfer_count,
                    SUM(quantity) as total_quantity,
                    COUNT(DISTINCT product_id) as unique_products
                FROM wh_transfers
                WHERE from_location IS NOT NULL
                GROUP BY from_location
                ORDER BY transfer_count DESC
            `);
            
            return result.rows;
        } catch (error) {
            console.error('Error getting source location stats:', error);
            throw error;
        }
    }

    // Статистика по локациям (куда)
    static async getDestinationLocationStats() {
        try {
            const result = await db.query(`
                SELECT 
                    to_location as location,
                    COUNT(*) as transfer_count,
                    SUM(quantity) as total_quantity,
                    COUNT(DISTINCT product_id) as unique_products
                FROM wh_transfers
                WHERE to_location IS NOT NULL
                GROUP BY to_location
                ORDER BY transfer_count DESC
            `);
            
            return result.rows;
        } catch (error) {
            console.error('Error getting destination location stats:', error);
            throw error;
        }
    }

    // Обновляет все математические модели
    static async updateAllModels() {
        try {
            await this.updateABCAnalysis();
            await this.updateInventoryForecasts();
            await this.updateProductKPIs();
            return { success: true, message: 'All models updated successfully' };
        } catch (error) {
            return { success: false, message: 'Failed to update models', error: error.message };
        }
    }

    static analyzeTransfers(transfers) {
        if (!transfers || transfers.length === 0) {
            return {
                totalTransfers: 0,
                avgPerDay: 0,
                mostActiveProduct: null,
                sourceLocations: {},
                destinationLocations: {}
            };
        }

        // Группируем по продуктам
        const byProduct = transfers.reduce((acc, transfer) => {
            if (!acc[transfer.product_id]) {
                acc[transfer.product_id] = {
                    count: 0,
                    name: transfer.product_name || `Product ${transfer.product_id}`
                };
            }
            acc[transfer.product_id].count++;
            return acc;
        }, {});

        // Группируем по локациям (откуда)
        const sourceLocations = transfers.reduce((acc, transfer) => {
            if (!transfer.from_location) return acc;
            if (!acc[transfer.from_location]) {
                acc[transfer.from_location] = {
                    count: 0,
                    totalQuantity: 0
                };
            }
            acc[transfer.from_location].count++;
            acc[transfer.from_location].totalQuantity += transfer.quantity;
            return acc;
        }, {});

        // Группируем по локациям (куда)
        const destinationLocations = transfers.reduce((acc, transfer) => {
            if (!transfer.to_location) return acc;
            if (!acc[transfer.to_location]) {
                acc[transfer.to_location] = {
                    count: 0,
                    totalQuantity: 0
                };
            }
            acc[transfer.to_location].count++;
            acc[transfer.to_location].totalQuantity += transfer.quantity;
            return acc;
        }, {});

        // Находим самый активный продукт
        const mostActive = Object.entries(byProduct)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.count - a.count)[0];

        // Рассчитываем среднее количество в день (за 90 дней)
        const days = 90;
        const total = transfers.length;
        const avgPerDay = total / days;

        return {
            totalTransfers: total,
            avgPerDay: avgPerDay,
            mostActiveProduct: mostActive,
            byProduct: byProduct,
            sourceLocations: sourceLocations,
            destinationLocations: destinationLocations
        };
    }
}

module.exports = WarehouseMathService;
