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
                    MAX(quantity) as max_daily_demand
                FROM wh_transfers
                WHERE transfer_date > CURRENT_DATE - INTERVAL '90 days'
                GROUP BY product_id
            `);
            
            // Получаем данные о времени поставки (заглушка - в реальной системе нужно брать из заказов)
            const leadTimeStats = {
                avg: 5, // Среднее время поставки в днях
                max: 10 // Максимальное время поставки
            };
            
            // Обновляем KPI для каждого товара
            for (const stat of stats.rows) {
                const safetyStock = WarehouseMath.calculateSafetyStock(
                    stat.max_daily_demand,
                    stat.avg_daily_demand,
                    leadTimeStats.max,
                    leadTimeStats.avg
                );
                
                const reorderPoint = WarehouseMath.calculateReorderPoint(
                    leadTimeStats.avg,
                    stat.avg_daily_demand,
                    safetyStock
                );
                
                // Рассчитываем оборачиваемость (заглушка)
                const turnoverRate = WarehouseMath.calculateTurnover(
                    stat.avg_daily_demand * 30, // Предполагаем месячные продажи
                    stat.avg_daily_demand * 15 // Средний запас за половину месяца
                );
                
                // Обновляем или вставляем запись
                await db.query(`
                    INSERT INTO wh_product_kpis 
                    (product_id, reorder_point, safety_stock, turnover_rate)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (product_id) 
                    DO UPDATE SET
                        reorder_point = EXCLUDED.reorder_point,
                        safety_stock = EXCLUDED.safety_stock,
                        turnover_rate = EXCLUDED.turnover_rate,
                        last_calculated = CURRENT_TIMESTAMP
                `, [stat.product_id, reorderPoint, safetyStock, turnoverRate]);
            }
        } catch (error) {
            console.error('Error in product KPIs update:', error);
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
}

module.exports = WarehouseMathService;