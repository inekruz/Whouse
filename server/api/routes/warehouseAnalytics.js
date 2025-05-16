const express = require('express');
const router = express.Router();
const db = require('../../db');
const validateAuthToken = require('./middleware/validateAuthTokenAdmin');
const WarehouseMathService = require('./middleware/warehouseMathService');

// Обновление всех моделей (можно вызывать по расписанию или вручную)
router.post('/update-models', validateAuthToken, async (req, res) => {
    try {
        const result = await WarehouseMathService.updateAllModels();
        if (result.success) {
            res.json({ message: result.message });
        } else {
            res.status(500).json({ error: result.message });
        }
    } catch (error) {
        console.error('Error updating models:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получение ABC-анализа
router.post('/abc-analysis', validateAuthToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.category, p.id as product_id, p.name, p.quantity, p.price
            FROM wh_abc_analysis a
            JOIN wh_products p ON a.product_id = p.id
            ORDER BY a.category, (p.quantity * p.price) DESC
        `);
        
        // Группируем по категориям для удобства
        const grouped = {
            A: result.rows.filter(r => r.category === 'A'),
            B: result.rows.filter(r => r.category === 'B'),
            C: result.rows.filter(r => r.category === 'C')
        };
        
        res.json(grouped);
    } catch (error) {
        console.error('Error getting ABC analysis:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получение прогноза остатков для товара
router.post('/forecast/:productId', validateAuthToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const result = await db.query(`
            SELECT forecast_date as date, predicted_quantity
            FROM wh_inventory_forecasts
            WHERE product_id = $1
            ORDER BY forecast_date
        `, [productId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting inventory forecast:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получение KPI по товару
router.post('/kpi/:productId', validateAuthToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const result = await db.query(`
            SELECT reorder_point, safety_stock, turnover_rate, eoq
            FROM wh_product_kpis
            WHERE product_id = $1
        `, [productId]);
        
        if (result.rows.length) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'KPIs not calculated for this product' });
        }
    } catch (error) {
        console.error('Error getting product KPIs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Анализ перемещений товаров
router.post('/transfer-stats', validateAuthToken, async (req, res) => {
    try {
        const transfers = await db.query(`
        SELECT t.product_id, p.name as product_name, 
                t.from_location as "from", t.to_location as "to", 
                t.transfer_date as date,
        FROM wh_transfers t
        LEFT JOIN wh_products p ON t.product_id = p.id
        WHERE t.transfer_date > CURRENT_DATE - INTERVAL '90 days'
        `);
                
        const stats = WarehouseMathService.analyzeTransfers(transfers.rows);
        res.json(stats);
    } catch (error) {
        console.error('Error analyzing transfers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 1. Получение точки заказа и страхового запаса
router.post('/inventory-levels/:productId', validateAuthToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const result = await db.query(`
            SELECT reorder_point, safety_stock
            FROM wh_product_kpis
            WHERE product_id = $1
        `, [productId]);
        
        if (result.rows.length) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Inventory levels not calculated for this product' });
        }
    } catch (error) {
        console.error('Error getting inventory levels:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Получение экономичного объема заказа (EOQ)
router.post('/eoq/:productId', validateAuthToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const result = await db.query(`
            SELECT eoq
            FROM wh_product_kpis
            WHERE product_id = $1
        `, [productId]);
        
        if (result.rows.length) {
            res.json({ eoq: result.rows[0].eoq });
        } else {
            res.status(404).json({ error: 'EOQ not calculated for this product' });
        }
    } catch (error) {
        console.error('Error getting EOQ:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Получение оборачиваемости товара
router.post('/turnover/:productId', validateAuthToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const { periodDays } = req.body;
        
        const turnoverRate = await WarehouseMathService.calculateTurnoverRate(
            productId, 
            periodDays || 30
        );
        
        res.json({ productId, turnoverRate, periodDays: periodDays || 30 });
    } catch (error) {
        console.error('Error calculating turnover rate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. Получение страхового запаса
router.post('/safety-stock/:productId', validateAuthToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const result = await db.query(`
            SELECT safety_stock
            FROM wh_product_kpis
            WHERE product_id = $1
        `, [productId]);
        
        if (result.rows.length) {
            res.json({ safetyStock: result.rows[0].safety_stock });
        } else {
            res.status(404).json({ error: 'Safety stock not calculated for this product' });
        }
    } catch (error) {
        console.error('Error getting safety stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 5. Статистика по локациям (откуда)
router.post('/source-location-stats', validateAuthToken, async (req, res) => {
    try {
        const stats = await WarehouseMathService.getSourceLocationStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting source location stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 6. Статистика по локациям (куда)
router.post('/destination-location-stats', validateAuthToken, async (req, res) => {
    try {
        const stats = await WarehouseMathService.getDestinationLocationStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting destination location stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получение всех KPI для товара (расширенная версия)
router.post('/full-kpi/:productId', validateAuthToken, async (req, res) => {
    try {
        const { productId } = req.params;
        
        // Получаем базовые KPI
        const kpiResult = await db.query(`
            SELECT *
            FROM wh_product_kpis
            WHERE product_id = $1
        `, [productId]);
        
        if (!kpiResult.rows.length) {
            return res.status(404).json({ error: 'KPIs not calculated for this product' });
        }
        
        // Получаем данные для дополнительных расчетов
        const demandStats = await db.query(`
            SELECT 
                AVG(quantity) as avg_daily_demand,
                STDDEV(quantity) as demand_stddev
            FROM wh_transfers
            WHERE product_id = $1
            AND transfer_date > CURRENT_DATE - INTERVAL '90 days'
        `, [productId]);
        
        const leadTimeStats = await db.query(`
            SELECT 
                AVG(EXTRACT(DAY FROM (received_date - ordered_date))) as avg_lead_time,
                STDDEV(EXTRACT(DAY FROM (received_date - ordered_date))) as lead_time_stddev
            FROM wh_purchase_orders
            WHERE product_id = $1
            AND received_date IS NOT NULL
        `, [productId]);
        
        // Рассчитываем оборачиваемость
        const turnoverRate = await WarehouseMathService.calculateTurnoverRate(productId);
        
        // Формируем полный ответ
        const response = {
            ...kpiResult.rows[0],
            demandStats: demandStats.rows[0] || {},
            leadTimeStats: leadTimeStats.rows[0] || {},
            calculatedTurnoverRate: turnoverRate
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error getting full product KPIs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
