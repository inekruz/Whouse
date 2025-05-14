const express = require('express');
const router = express.Router();
const db = require('../../db');
const validateAuthToken = require('./middleware/validateAuthTokenAdmin');

router.post('/get', validateAuthToken, async (req, res) => {
  try {
    // Получаем все записи из таблицы wh_actions
    const actionsQuery = 'SELECT * FROM wh_actions';
    const actionsResult = await db.query(actionsQuery);
    
    if (actionsResult.rows.length === 0) {
      return res.status(200).json([]);
    }
    
    // Собираем все user_code из полученных действий
    const userCodes = actionsResult.rows.map(action => action.user_code);
    
    // Получаем username для каждого user_code из таблицы wh_users
    const usersQuery = 'SELECT user_code, username FROM wh_users WHERE user_code = ANY($1)';
    const usersResult = await db.query(usersQuery, [userCodes]);
    
    // Создаем маппинг user_code -> username для быстрого доступа
    const userMap = {};
    usersResult.rows.forEach(user => {
      userMap[user.user_code] = user.username;
    });
    
    // Объединяем данные
    const combinedData = actionsResult.rows.map(action => {
      return {
        ...action,
        username: userMap[action.user_code] || null
      };
    });
    
    res.status(200).json(combinedData);
  } catch (error) {
    console.error('Error fetching actions and users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;