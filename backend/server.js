const express = require('express'); // Heartbeat: 2026-01-27T23:01:00+05:30
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') }); // Must be first

const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require(path.join(__dirname, 'routes', 'auth'));
// const notificationRoutes = require(path.join(__dirname, 'routes', 'notificationRoutes')); // Removed
const { notFound, errorHandler } = require(path.join(__dirname, 'middleware', 'errorMiddleware'));
const { startStockScheduler } = require('./utils/stockScheduler');
const { startNotificationScheduler } = require('./utils/notificationScheduler');
const { startSubscriptionScheduler } = require('./utils/subscriptionScheduler');
const { startImageCleanupScheduler } = require('./utils/imageCleanupScheduler');
const { initSocket } = require('./config/socket');

// connectDB(); // Called below

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// DEBUG LOGGER
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
// app.use('/api/users', require('./routes/userRoutes')); // Removed: File does not exist
app.use('/api/admin', require('./routes/adminRoutes'));
// app.use('/api/notifications', require('./routes/notificationRoutes')); // Removed
app.use('/api/interests', require('./routes/interestRoutes')); // NEW Interest Logic
app.use('/api/seller', require('./routes/sellerRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/master', require('./routes/masterRoutes')); // New Mount
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Request Routes (Legacy - 410 Gone managed inside)
app.use('/api/requests', require('./routes/requestRoutes')); // New Request System

// Visit Routes (Legacy - 410 Gone managed inside)
app.use('/api/visits', require('./routes/visitRoutes')); // New Visit Logic

// NEW Unified Visit Routes
app.use('/api/customer-visits', require('./routes/customerVisitRoutes')); // NEW Step 3

app.post('/visits/finalize-visit/:id', (req, res) => { // New DEBUG Path
  res.status(200).json({ message: `Visit ${req.params.id} finalized via DEBUG path.` });
});
app.use('/api/bookings', require('./routes/bookingRoutes')); // New Bookings Logic (Step 2/3)
app.use('/api/seller/bookings', require('./routes/sellerBookingRoutes')); // New Seller Booking Logic (Step 5)
app.use('/api/support', require('./routes/supportRoutes')); // NEW Support System (Step 12)
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/customer', require('./routes/customerRoutes')); // Customer Panel Routes
app.use('/api/location', require('./routes/locationRoutes')); // OSM Location Routes
app.use('/api/categories', require('./routes/categoryRoutes')); // Global Category API
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Services
const runRequestScheduler = require('./services/requestScheduler');

const PORT = process.env.PORT || 5000;

// Start schedulers
connectDB().then(() => {
  runRequestScheduler(); // Move inside DB block
  startStockScheduler(); // Initialize Daily Stock Reset Job
  startNotificationScheduler(); // Initialize Recurring Notifications (Greetings, Reminders)
  startSubscriptionScheduler(); // Initialize Subscription Expiry Checks
  startImageCleanupScheduler(); // Initialize Image Cleanup Job
  const http = require('http');
  const httpServer = http.createServer(app);
  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
  initSocket(httpServer);
});
