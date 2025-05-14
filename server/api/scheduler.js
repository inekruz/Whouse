const cron = require('node-cron');
const WarehouseMathService = require('./routes/middleware/warehouseMathService');

// Обновляем модели каждую минуту
cron.schedule('* * * * *', async () => {
    console.log('Running scheduled models update...');
    try {
        const result = await WarehouseMathService.updateAllModels();
        
        if (result.success) {
            console.log('Success:', result.message);
        } else {
            console.error('Partial failure:', result.message);
            if (result.error) {
                console.error('Error details:', result.error);
            }
        }
    } catch (error) {
        console.error('Critical error in scheduled update:', {
            message: error.message,
            stack: error.stack
        });
    }
});

module.exports = cron;