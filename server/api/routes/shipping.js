const express = require('express');
const router = express.Router();
const db = require('../../db');
const validateAuthToken = require('./middleware/validateAuthToken');
const { logAction } = require('./middleware/actionLogger');

// Получение списка товаров
router.get('/products', validateAuthToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.id, p.name, p.description, p.quantity, p.price, 
             c.name as category_name, c.id as category_id
      FROM wh_products p
      JOIN wh_categories c ON p.category_id = c.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Ошибка получения списка товаров' });
  }
});

// Получение списка категорий
router.get('/categories', validateAuthToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name FROM wh_categories');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Ошибка получения списка категорий' });
  }
});

// Получение списка партий
router.get('/batches', validateAuthToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.id, b.product_id, b.batch_number, b.quantity, 
             b.received_date, b.supplier, b.invoice_number,
             p.name as product_name
      FROM wh_batches b
      JOIN wh_products p ON b.product_id = p.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ message: 'Ошибка получения списка партий' });
  }
});

// Приемка товара
router.post('/receive', validateAuthToken, async (req, res) => {
  const { productId, quantity, batchNumber, serialNumbers, supplier, invoiceNumber, user_code } = req.body;
  
  try {
    await db.query('BEGIN');
    
    // 1. Добавляем партию
    const batchResult = await db.query(
      `INSERT INTO wh_batches 
       (product_id, batch_number, quantity, received_date, supplier, invoice_number, serial_numbers)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
       RETURNING *`,
      [productId, batchNumber, quantity, supplier, invoiceNumber, serialNumbers]
    );
    
    // 2. Обновляем количество товара
    await db.query(
      `UPDATE wh_products 
       SET quantity = quantity + $1 
       WHERE id = $2`,
      [quantity, productId]
    );
    
    // 3. Логируем действие
    await logAction(user_code, `Приемка товара: ${batchNumber}, количество: ${quantity}`);
    
    await db.query('COMMIT');
    
    res.json({
      success: true,
      batch: batchResult.rows[0]
    });
    
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error receiving product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при приемке товара' 
    });
  }
});

// Отгрузка товара
router.post('/ship', validateAuthToken, async (req, res) => {
  const { productId, quantity, recipient, user_code } = req.body;
  
  try {
    await db.query('BEGIN');
    
    // 1. Проверяем наличие товара
    const product = await db.query(
      'SELECT quantity FROM wh_products WHERE id = $1',
      [productId]
    );
    
    if (product.rows.length === 0 || product.rows[0].quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Недостаточно товара на складе'
      });
    }
    
    // 2. Обновляем количество товара
    await db.query(
      `UPDATE wh_products 
       SET quantity = quantity - $1 
       WHERE id = $2`,
      [quantity, productId]
    );
    
    // 3. Добавляем запись об отгрузке
    const shipmentResult = await db.query(
      `INSERT INTO wh_shipments 
       (product_id, quantity, recipient, shipping_date, user_code)
       VALUES ($1, $2, $3, CURRENT_DATE, $4)
       RETURNING *`,
      [productId, quantity, recipient, user_code]
    );
    
    // 4. Логируем действие
    await logAction(user_code, `Отгрузка товара ID: ${productId}, количество: ${quantity}, получатель: ${recipient}`);
    
    await db.query('COMMIT');
    
    res.json({
      success: true,
      shipment: shipmentResult.rows[0]
    });
    
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error shipping product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при отгрузке товара' 
    });
  }
});

module.exports = router;