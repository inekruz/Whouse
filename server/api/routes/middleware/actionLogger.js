const db = require('../../../db');

// Функция для логирования действий
async function logAction(user_code, action) {
  const description = `${action}`;
  const query = `INSERT INTO wh_actions (user_code, description) VALUES ($1, $2)`;
  
  try {
    await db.query(query, [user_code, description]);
  } catch (err) {
    console.error('Ошибка при логировании действия:', err);
  }
}

module.exports = { logAction };
