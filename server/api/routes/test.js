const express = require('express');
const db = require('../../db');
const router = express.Router();
module.exports = (io) => {
  router.get('/get', async (req, res) => {
        try {
            res.status(200).json({ success: 'Сокет в норме'});
        } catch (err) {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });
    return router;
};
