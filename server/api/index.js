require('dotenv').config();
require('./scheduler');
const express = require('express');
const http = require('http');
const cors = require('cors');
const config = require('../config/config');
const Auth = require('./routes/auth');
const Admin = require('./routes/admin');
const AdmUsers = require('./routes/admUsers');
const Product = require('./routes/products');
const Shipping = require('./routes/shipping');
const Inventory = require('./routes/inventory');
const warehouseAnalytics = require('./routes/warehouseAnalytics');
const History = require('./routes/history');
const Backup = require('./routes/backup');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Ну я работаю! 🚀 Что тебе тут нужно ?');
});

app.use('/auth', Auth);
app.use('/adm', Admin);
app.use('/users', AdmUsers);
app.use('/prd', Product);
app.use('/shp', Shipping);
app.use('/inv', Inventory);
app.use('/math', warehouseAnalytics);
app.use('/history', History);
app.use('/bcp', Backup);

const startServer = () => {
  server.listen(config.port, () => {
    console.log(`Express сервер запущен на http://localhost:${config.port}`);
  });
};

module.exports = startServer;
