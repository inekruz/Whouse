const crypto = require('crypto');
const db = require('../../../db');

const secretKey = process.env.AUTH_TOKEN;

const generateToken = (userId) => {
  const data = `${userId}:${secretKey}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

const validateAuthToken = async (req, res, next) => {
  const clientToken = req.headers['x-auth-token'];
  const user_id = req.body.adminCode;

  if (!clientToken || !user_id) {
    return res.status(400).json({ message: 'Ты ничего не забыл добавить :)' });
  }

  const [timestampStr, token] = clientToken.split('-');
  if (!timestampStr || !token) {
    return res.status(400).json({ message: 'Неверный формат токена' });
  }

  const timestamp = Number(timestampStr);
  if (isNaN(timestamp)) {
    return res.status(400).json({ message: 'Неверный timestamp' });
  }

  // Проверка возраста токена
  const tokenAgeHours = (Date.now() - timestamp) / (1000 * 60 * 60);
  if (tokenAgeHours > 24) {
    return res.status(403).json({ message: 'Фу, токен слишком старый' });
  }

  const expectedToken = generateToken(user_id);

  if (token !== expectedToken) {
    return res.status(403).json({ message: 'Блин, а токен то неверный :)' });
  }

  try {
    // Проверка, был ли уже использован
    const result = await db.query('SELECT * FROM wh_used_tokens WHERE token = $1', [clientToken]);

    if (result.rows.length > 0) {
      return res.status(403).json({ message: 'Такой токен уже использовали! Не жульничай!' });
    }

    // Добавление токена
    await db.query('INSERT INTO wh_used_tokens (token, user_id, created_at) VALUES ($1, $2, NOW())', [clientToken, user_id]);
  } catch (error) {
    console.error('Ошибка при проверке токена:', error);
    return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }

  next();
};

module.exports = validateAuthToken;