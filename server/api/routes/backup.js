const express = require('express');
const router = express.Router();
const db = require('../../db');
const validateAuthToken = require('./middleware/validateAuthTokenAdmin');
const { Transform } = require('stream');

router.post('/backup', validateAuthToken, async (req, res) => {
  const { tableName } = req.body;

  // Проверяем, что таблица начинается с wh_
  if (!tableName || !tableName.startsWith('wh_')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid table name. Table name must start with wh_'
    });
  }

  try {
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);

    if (!tableExists.rows[0].exists) {
      return res.status(404).json({
        success: false,
        message: `Table ${tableName} not found`
      });
    }

    // Устанавливаем заголовки для скачивания CSV файла
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${tableName}_backup_${new Date().toISOString().slice(0,10)}.csv`);

    // Создаем поток для преобразования данных в CSV
    const csvTransform = new Transform({
      transform(chunk, encoding, callback) {
        this.push(chunk);
        callback();
      }
    });

    // Получаем данные из таблицы и конвертируем в CSV
    // Исправленная строка - убрали new db.Query()
    const queryStream = db.query(`
      COPY (SELECT * FROM ${tableName}) TO STDOUT WITH CSV HEADER
    `);

    // Отправляем данные клиенту
    queryStream.pipe(csvTransform).pipe(res);

    // Обработка ошибок потоков
    queryStream.on('error', (err) => {
      console.error('Ошибка потока базы данных:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error generating CSV backup'
        });
      }
    });

    csvTransform.on('error', (err) => {
      console.error('Ошибка преобразования CSV:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error processing CSV data'
        });
      }
    });

  } catch (error) {
    console.error('Ошибка во время резервного копирования таблицы:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error during backup'
      });
    }
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