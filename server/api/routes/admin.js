const express = require('express');
const router = express.Router();
const validateAuthToken = require('./middleware/validateAuthToken');

router.post('/get', validateAuthToken, async (req, res) => {
  try {
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;