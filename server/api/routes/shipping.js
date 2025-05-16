const express = require('express');
const router = express.Router();
const db = require('../../db');
const validateAuthToken = require('./middleware/validateAuthToken');
const { logAction } = require('./middleware/actionLogger');

// Получение списка товаров
router.post('/products', validateAuthToken, async (req, res) => {
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
router.post('/categories', validateAuthToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name FROM wh_categories');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Ошибка получения списка категорий' });
  }
});

// Получение списка партий
router.post('/batches', validateAuthToken, async (req, res) => {
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
    
    const batches = await db.query(
      `SELECT id, quantity FROM wh_batches 
       WHERE product_id = $1 AND quantity > 0
       ORDER BY received_date ASC`,
      [productId]
    );
    
    if (batches.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Нет доступных партий товара для отгрузки'
      });
    }
    
    let remainingQuantity = quantity;
    
    for (const batch of batches.rows) {
      if (remainingQuantity <= 0) break;
      
      const batchQuantity = batch.quantity;
      const newQuantity = Math.max(0, batchQuantity - remainingQuantity);
      remainingQuantity -= batchQuantity;
      
      if (newQuantity > 0) {
        await db.query(
          `UPDATE wh_batches 
           SET quantity = $1 
           WHERE id = $2`,
          [newQuantity, batch.id]
        );
      } else {
        await db.query(
          'DELETE FROM wh_batches WHERE id = $1',
          [batch.id]
        );
      }
    }
    
    if (remainingQuantity > 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Недостаточно товара в партиях для отгрузки'
      });
    }
    
    const updateResult = await db.query(
      `UPDATE wh_products 
       SET quantity = quantity - $1 
       WHERE id = $2
       RETURNING quantity`,
      [quantity, productId]
    );
    
    const newQuantity = updateResult.rows[0].quantity;
    
    if (newQuantity <= 0) {
      await db.query(
        'DELETE FROM wh_abc_analysis WHERE product_id = $1',
        [productId]
      );
      
      await db.query(
        'DELETE FROM wh_products WHERE id = $1',
        [productId]
      );
      
      await logAction(user_code, `Автоматически удален товар ID: ${productId} после отгрузки (количество <= 0)`);
    }
    
    await logAction(user_code, `Отгрузка товара ID: ${productId}, количество: ${quantity}, получатель: ${recipient}`);
    
    await db.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Товар успешно отгружен',
      productDeleted: newQuantity <= 0
    });
    
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error shipping product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при отгрузке товара',
      details: error.detail 
    });
  }
});

// Обновление партии
router.post('/updateBatch', validateAuthToken, async (req, res) => {
  const { id, batch_number, quantity, supplier, invoice_number, serial_numbers, user_code } = req.body;
  
  try {
    await db.query('BEGIN');
    
    // Получаем текущие данные партии
    const currentBatch = await db.query(
      'SELECT product_id, quantity FROM wh_batches WHERE id = $1',
      [id]
    );
    
    if (currentBatch.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Партия не найдена'
      });
    }
    
    const productId = currentBatch.rows[0].product_id;
    const oldQuantity = currentBatch.rows[0].quantity;
    const quantityDiff = quantity - oldQuantity;
    
    // 1. Обновляем партию
    const batchResult = await db.query(
      `UPDATE wh_batches 
       SET batch_number = $1, quantity = $2, supplier = $3, 
           invoice_number = $4, serial_numbers = $5
       WHERE id = $6
       RETURNING *`,
      [batch_number, quantity, supplier, invoice_number, serial_numbers, id]
    );
    
    // 2. Обновляем количество товара, если изменилось количество
    if (quantityDiff !== 0) {
      await db.query(
        `UPDATE wh_products 
         SET quantity = quantity + $1 
         WHERE id = $2`,
        [quantityDiff, productId]
      );
    }
    
    // 3. Получаем обновленное количество товара для клиента
    const updatedProduct = await db.query(
      'SELECT id as product_id, quantity as new_quantity FROM wh_products WHERE id = $1',
      [productId]
    );
    
    // 4. Логируем действие
    await logAction(user_code, `Обновление партии: ${batch_number}, изменение количества: ${quantityDiff}`);
    
    await db.query('COMMIT');
    
    res.json({
      success: true,
      batch: batchResult.rows[0],
      updatedProduct: updatedProduct.rows[0]
    });
    
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error updating batch:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении партии' 
    });
  }
});

// Удаление партии
router.post('/deleteBatch', validateAuthToken, async (req, res) => {
  const { batchId, user_code } = req.body;
  
  try {
    await db.query('BEGIN');
    
    // 1. Получаем данные партии для обновления количества товара
    const batch = await db.query(
      'SELECT product_id, quantity FROM wh_batches WHERE id = $1',
      [batchId]
    );
    
    if (batch.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Партия не найдена'
      });
    }
    
    const productId = batch.rows[0].product_id;
    const quantity = batch.rows[0].quantity;
    
    // 2. Удаляем партию
    await db.query(
      'DELETE FROM wh_batches WHERE id = $1',
      [batchId]
    );
    
    // 3. Обновляем количество товара
    await db.query(
      `UPDATE wh_products 
       SET quantity = quantity - $1 
       WHERE id = $2`,
      [quantity, productId]
    );
    
    // 4. Получаем обновленное количество товара для клиента
    const updatedProduct = await db.query(
      'SELECT id as product_id, quantity as new_quantity FROM wh_products WHERE id = $1',
      [productId]
    );
    
    // 5. Логируем действие
    await logAction(user_code, `Удаление партии ID: ${batchId}, товара: ${productId}, количество: ${quantity}`);
    
    await db.query('COMMIT');
    
    res.json({
      success: true,
      updatedProduct: updatedProduct.rows[0]
    });
    
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error deleting batch:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при удалении партии' 
    });
  }
});
module.exports = router;
