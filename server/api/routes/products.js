const express = require('express');
const router = express.Router();
const db = require('../../db');
const validateAuthToken = require('./middleware/validateAuthToken');
const { logAction } = require('./middleware/actionLogger');

// Получение всех товаров
router.post('/getAll', validateAuthToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM wh_products ORDER BY id DESC');
    res.json({ products: result.rows });
  } catch (err) {
    console.error('Ошибка при получении товаров:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавление товара
router.post('/add', validateAuthToken, async (req, res) => {
  const { name, description, category_id, quantity, price, location, user_code } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO wh_products (name, description, category_id, quantity, price, location)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, category_id, quantity, price, location]
    );
    await logAction(user_code, `Добавил товар: ${name} | ${category_id} | ${quantity} | ${price}`);

    res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при добавлении товара:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление товара
router.put('/update/:id', validateAuthToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, category_id, quantity, price, location, user_code } = req.body;

  try {
    const result = await db.query(
      `UPDATE wh_products
       SET name = $1, description = $2, category_id = $3, quantity = $4, price = $5, location = $6
       WHERE id = $7 RETURNING *`,
      [name, description, category_id, quantity, price, location, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    await logAction(user_code, `Изменил товар: ${name} | ${category_id} | ${quantity} | ${price}`);
    res.json({ product: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при обновлении товара:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удаление товара
router.delete('/delete/:id', validateAuthToken, async (req, res) => {
  const { id } = req.params;
  const { user_code } = req.body;

  try {
    await db.query('BEGIN');

    await db.query('DELETE FROM wh_abc_analysis WHERE product_id = $1', [id]);
    await db.query('DELETE FROM wh_shipments WHERE product_id = $1', [id]);
    const result = await db.query('DELETE FROM wh_products WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Товар не найден' });
    }

    await db.query('COMMIT');
    
    await logAction(user_code, `Удалил товар: ${id}`);
    res.status(200).json({ message: 'Товар успешно удалён' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Ошибка при удалении товара:', err);
    res.status(500).json({ 
      error: 'Ошибка сервера',
      details: err.detail
    });
  }
});

// Получение всех категорий
router.post('/ctg/getAll', validateAuthToken, async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM wh_categories ORDER BY id ASC');
      res.json({ categories: result.rows });
    } catch (err) {
      console.error('Ошибка при получении категорий:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  
module.exports = router;
