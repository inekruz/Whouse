const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const db = require('../../db');
const validateAuthToken = require('./middleware/validateAuthToken');
const bcrypt = require('bcrypt');
const config = require('../../config');

router.post('/get', validateAuthToken, async (req, res) => {
  try {
    const { login, password, adminCode } = req.body;

    const admin = await db.query('SELECT * FROM wh_admins WHERE login = $1 AND code = $2', [login, adminCode]);
    
    if (admin.rows.length === 0) {
      return res.status(401).json({ error: 'Неверные учетные данные администратора' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.rows[0].password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }

    const adminToken = jwt.sign(
      { id: admin.rows[0].id, login: admin.rows[0].login, role: 'admin' },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({ success: true, message: 'Аутентификация успешна', token: adminToken });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', validateAuthToken, async (req, res) => {
  try {
    const { login, password, confirmPassword, adminCode } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Пароли не совпадают' });
    }

    const existingAdmin = await db.query('SELECT * FROM wh_admins WHERE login = $1', [login]);
    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({ error: 'Администратор с таким логином уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await db.query(
      'INSERT INTO wh_admins (login, password, code) VALUES ($1, $2, $3) RETURNING id, login',
      [login, hashedPassword, adminCode]
    );

    const adminToken = jwt.sign(
      { 
        id: newAdmin.rows[0].id, 
        login: newAdmin.rows[0].login, 
        role: 'admin' 
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      message: 'Администратор успешно зарегистрирован',
      token: adminToken
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;