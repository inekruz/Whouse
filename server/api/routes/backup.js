const express = require('express');
const router = express.Router();
const db = require('../../db');
const validateAuthToken = require('./middleware/validateAuthTokenAdmin');
const { stringify } = require('csv-stringify/sync');

router.post('/backup', validateAuthToken, async (req, res) => {
  const { tableName } = req.body;

  // Проверка что название таблицы начинается с wh_
  if (!tableName.startsWith('wh_')) {
    return res.status(400).json({ 
      error: 'Invalid table name', 
      message: 'Table name must start with wh_' 
    });
  }

  try {
    // Получаем данные из таблицы
    const query = `SELECT * FROM ${tableName}`;
    const { rows } = await db.query(query);

    if (rows.length === 0) {
      return res.status(404).json({ 
        message: 'Table is empty' 
      });
    }

    // Конвертируем в CSV
    const csv = stringify(rows, {
      header: true,
      columns: Object.keys(rows[0])
    });

    // Устанавливаем заголовки для скачивания файла
    res.setHeader('Content-Type', 'text/csv; application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${tableName}_backup.csv`);
    
    // Отправляем CSV
    return res.send(csv);

  } catch (error) {
    console.error('Backup error:', error);
    return res.status(500).json({ 
      error: 'Backup failed', 
      message: error.message 
    });
  }
});

router.post('/get', validateAuthToken, async (req, res) => {
  try {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'wh\\_%' ESCAPE '\\'
    `;

    const result = await db.query(query);
    const tables = result.rows.map(row => row.table_name || Object.values(row)[0]);
    
    res.json({
      success: true,
      tables: tables
    });
    
  } catch (error) {
    console.error('Error fetching wh_ tables:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching tables'
    });
  }
});

module.exports = router;
