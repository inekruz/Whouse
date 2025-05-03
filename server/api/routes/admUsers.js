const express = require('express');
const router = express.Router();
const db = require('../../db');
const validateAuthToken = require('./middleware/validateAuthTokenAdmin');
const bcrypt = require('bcrypt');

// Получение списка пользователей
router.post('/get', validateAuthToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.body;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM wh_users';
    let countQuery = 'SELECT COUNT(*) FROM wh_users';
    const params = [];
    
    if (search) {
      query += ' WHERE username ILIKE $1 OR login ILIKE $1';
      countQuery += ' WHERE username ILIKE $1 OR login ILIKE $1';
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const users = await db.query(query, params);
    const totalCount = await db.query(countQuery, params.slice(0, search ? 1 : 0));
    
    res.json({
      success: true,
      data: users.rows,
      pagination: {
        total: parseInt(totalCount.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
  }

// Создание пользователя
router.post('/add', validateAuthToken, async (req, res) => {
  try {
    const { username, login, password, user_code } = req.body;
    
    if (!login || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }
    
    const existingUser = await db.query('SELECT * FROM wh_users WHERE login = $1', [login]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    let randomInRange = getRandomNumber(100000, 500000);
    let user_id = (Number(randomInRange) + Number(user_code)).toFixed();
    const newUser = await db.query(
      'INSERT INTO wh_users (user_id, username, login, password, user_code) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, username, login, hashedPassword, user_code]
    );
    
    res.json({
      success: true,
      message: 'Пользователь успешно создан',
      data: newUser.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновление пользователя
router.put('/upd/:id', validateAuthToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, login, password, user_code } = req.body;
    
    const user = await db.query('SELECT * FROM wh_users WHERE id = $1', [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    let hashedPassword = user.rows[0].password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    const updatedUser = await db.query(
      'UPDATE wh_users SET username = $1, login = $2, password = $3, user_code = $4 WHERE id = $5 RETURNING *',
      [username || user.rows[0].username, 
       login || user.rows[0].login, 
       hashedPassword, 
       user_code || user.rows[0].user_code, 
       id]
    );
    
    res.json({
      success: true,
      message: 'Пользователь успешно обновлен',
      data: updatedUser.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Удаление пользователя
router.post('/delete', validateAuthToken, async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'ID пользователя обязательно' });
    }
    
    const user = await db.query('SELECT * FROM wh_users WHERE id = $1', [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    await db.query('DELETE FROM wh_users WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Пользователь успешно удален'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;