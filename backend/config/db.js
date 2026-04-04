const mongoose = require('mongoose');

const connectDB = async () => {
  const MAX_RETRIES = 5;
  let retries = 0;

  // Listen for connection events
  mongoose.connection.on('connected', () => {
    console.log(`[Database] Mongoose connected to ${mongoose.connection.host}/${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[Database] Mongoose connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Mongoose disconnected');
  });

  while (retries < MAX_RETRIES) {
    try {
      console.log(`[Database] Connection attempt ${retries + 1}/${MAX_RETRIES}...`);
      await mongoose.connect(process.env.MONGO_URI);
      // Wait a bit for listeners to fire if needed
      return;
    } catch (error) {
      console.error(`[Database] Attempt ${retries + 1} Failed: ${error.message}`);
      retries++;
      if (retries === MAX_RETRIES) {
        console.error('[Database] All attempts failed. Exiting.');
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, 2000));
    }
  }
};

module.exports = connectDB;
