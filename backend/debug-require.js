try {
    const controller = require('./controllers/requestController');
    console.log('Controller loaded:', Object.keys(controller));
} catch (error) {
    console.error('Error loading controller:', error);
}
