const cron = require('node-cron');
const WarehouseMathService = require('./routes/middleware/warehouseMathService');

// Обновляем модели каждую ночь в 2:00
cron.schedule('0 2 * * *', async () => {
    console.log('Running scheduled models update...');
    try {
        const result = await WarehouseMathService.updateAllModels();
        console.log('Scheduled update result:', result.message);
    } catch (error) {
        console.error('Error in scheduled update:', error);
    }
});

module.exports = cron;