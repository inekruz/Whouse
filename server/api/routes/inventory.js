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

module.exports = router;