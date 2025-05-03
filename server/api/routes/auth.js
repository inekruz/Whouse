const express = require('express');
const router = express.Router();
const db = require('../../db');
const jwt = require('jsonwebtoken');
const validateAuthToken = require('./middleware/validateAuthToken');
require('dotenv').config();

router.post('/login', validateAuthToken, async (req, res) => {
  try {
    const { login, password, user_code } = req.body;

    // Проверяем наличие обязательных полей
    if (!login || !password || !user_code) {
      return res.status(400).json({ error: 'Login, password and user_code are required' });
    }

    // Ищем пользователя в базе данных
    const query = `
      SELECT * FROM wh_users 
      WHERE login = $1 AND password = $2 AND user_code = $3
    `;
    const { rows } = await db.query(query, [login, password, user_code]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    // Создаем JWT токен
    const token = jwt.sign(
      {
        userId: user.user_id,
        username: user.username,
        login: user.login
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Возвращаем токен в ответе
    res.json({ 
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        login: user.login
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;