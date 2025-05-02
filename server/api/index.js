require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const config = require('../config/config');
const Auth = require('./routes/auth');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Ну я работаю! 🚀 Что тебе тут нужно ?');
});

app.use('/api/auth', Auth);

const startServer = () => {
  server.listen(config.port, () => {
    console.log(`Express сервер запущен на http://localhost:${config.port}`);
  });
};

module.exports = startServer;
