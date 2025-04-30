require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const config = require('../config/config');
const Test = require('./routes/test');
const createSocketServer = require('./socket');

const app = express();
const server = http.createServer(app);

const io = createSocketServer(server);

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Ну я работаю! 🚀 Что тебе тут нужно ?');
});

app.use('/api/test', Test(io));

const startServer = () => {
  server.listen(config.port, () => {
    console.log(`Express сервер запущен на http://localhost:${config.port}`);
  });
};

module.exports = startServer;
