const express = require('express');
const router = express.Router();
const db = require('../../db');
const validateAuthToken = require('./middleware/validateAuthToken');
const { logAction } = require('./middleware/actionLogger');

// Получение списка товаров
router.post('/products', validateAuthToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, quantity, location 
       FROM wh_products 
       ORDER BY name`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение списка перемещений
router.post('/transfers', validateAuthToken, async (req, res) => {
  try {
    const { user_code } = req.body;
    
    const result = await db.query(
      `SELECT id, product_name as product, from_location as "from", 
              to_location as "to", transfer_date as date, status
       FROM wh_transfers 
       WHERE user_code = $1 
       ORDER BY transfer_date DESC`,
      [user_code]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение списка инвентаризаций
router.post('/inventory-checks', validateAuthToken, async (req, res) => {
  try {
    const { user_code } = req.body;
    
    const result = await db.query(
      `SELECT id, check_date as date, items_checked as "itemsChecked", 
              discrepancies, status
       FROM wh_inventory_checks 
       WHERE user_code = $1 
       ORDER BY check_date DESC`,
      [user_code]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory checks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Добавление перемещения (сервер сам получает название товара)
router.post('/transfers/add', validateAuthToken, async (req, res) => {
  try {
    const { user_code, product_id, from_location, to_location, status } = req.body;
    
    // 1. Проверяем наличие обязательных полей
    if (!product_id) {
      return res.status(400).json({ error: 'ID товара обязательно' });
    }

    // 2. Получаем информацию о товаре из базы данных
    const productQuery = await db.query(
      `SELECT name FROM wh_products 
       WHERE id = $1`,
      [product_id]
    );

    if (productQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    const product_name = productQuery.rows[0].name;

    // 3. Добавляем запись о перемещении
    const transferQuery = await db.query(
      `INSERT INTO wh_transfers 
       (user_code, product_id, product_name, from_location, to_location, transfer_date, status)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6)
       RETURNING *`,
      [user_code, product_id, product_name, from_location, to_location, status]
    );
    
    await logAction(user_code, `Добавил Перемещение товара: ${product_id} | ${product_name}`);
    // 4. Возвращаем созданную запись
    res.status(201).json(transferQuery.rows[0]);
  } catch (error) {
    console.error('Error adding transfer:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Добавление инвентаризации
router.post('/inventory/add', validateAuthToken, async (req, res) => {
  try {
    const { user_code, items_checked, discrepancies, status } = req.body;
    
    const result = await db.query(
      `INSERT INTO wh_inventory_checks 
       (user_code, check_date, items_checked, discrepancies, status)
       VALUES ($1, CURRENT_DATE, $2, $3, $4)
       RETURNING *`,
      [user_code, items_checked, discrepancies, status]
    );
    
    await logAction(user_code, `Добавил Инвентаризацию из [${items_checked}] в [${discrepancies}]`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding inventory check:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;