const express = require('express'); // Heartbeat: 2026-01-27T23:01:00+05:30
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') }); // Must be first

const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require(path.join(__dirname, 'routes', 'auth'));
const notificationRoutes = require(path.join(__dirname, 'routes', 'notificationRoutes'));
const { notFound, errorHandler } = require(path.join(__dirname, 'middleware', 'errorMiddleware'));
const { startStockScheduler } = require('./utils/stockScheduler');
const { startNotificationScheduler } = require('./utils/notificationScheduler');
const { startSubscriptionScheduler } = require('./utils/subscriptionScheduler');
const { startImageCleanupScheduler } = require('./utils/imageCleanupScheduler');
const { initSocket } = require('./config/socket');
const { initQueues } = require('./config/queue');
const { initEventBus } = require('./utils/eventBus');

// connectDB(); // Called below

const helmet = require('helmet');

const app = express();

// Helmet Security Headers (Fix 2)
app.use(helmet());

// Custom NoSQL Injection Protection helper for Express 5 compatibility (Fix 4)
const sanitizeObject = (obj) => {
  if (obj instanceof Object) {
    for (let key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitizeObject(obj[key]);
      }
    }
  }
};

const customMongoSanitize = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  if (req.query && typeof req.query === 'object') {
    for (let key in req.query) {
      if (key.startsWith('$') || key.includes('.')) {
        delete req.query[key];
      } else if (typeof req.query[key] === 'object') {
        sanitizeObject(req.query[key]);
      }
    }
  }
  next();
};

app.use(customMongoSanitize);

// Custom XSS Sanitizer for Express 5 compatibility (Fix 5)
const cleanXssString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '') // Strip script tags
    .replace(/<\/?[^>]+(>|$)/g, '') // Strip HTML tags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const cleanXssObject = (obj) => {
  if (obj && typeof obj === 'object') {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = cleanXssString(obj[key]);
      } else if (typeof obj[key] === 'object') {
        cleanXssObject(obj[key]);
      }
    }
  }
};

const customXssClean = (req, res, next) => {
  if (req.body) cleanXssObject(req.body);
  if (req.params) cleanXssObject(req.params);
  if (req.query && typeof req.query === 'object') {
    for (let key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = cleanXssString(req.query[key]);
      } else if (typeof req.query[key] === 'object') {
        cleanXssObject(req.query[key]);
      }
    }
  }
  next();
};

app.use(customXssClean);

// CORS Hardening (Fix 6)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['https://aisle.in', 'https://app.aisle.in', 'https://admin.aisle.in', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Public Health Check Endpoint (Stage 9 Health Checks)
app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const { isRedisActive, getRedisClient } = require('./config/redis');
  const { getIO } = require('./config/socket');
  const { stockQueue } = require('./config/queue');
  
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  let redisStatus = 'disconnected';
  if (isRedisActive()) {
    try {
      const redis = getRedisClient();
      const ping = await redis.ping();
      redisStatus = ping === 'PONG' ? 'connected' : 'unhealthy';
    } catch (e) {
      redisStatus = `unhealthy: ${e.message}`;
    }
  }

  let socketsStatus = 'inactive';
  let socketCount = 0;
  try {
    const io = getIO();
    if (io) {
      socketsStatus = 'active';
      socketCount = io.sockets.sockets.size || 0;
    }
  } catch (e) {
    socketsStatus = `inactive: ${e.message}`;
  }

  let queueStatus = 'inactive';
  try {
    if (stockQueue) {
      await stockQueue.getJobCounts('wait');
      queueStatus = 'active';
    }
  } catch (e) {
    queueStatus = `unhealthy: ${e.message}`;
  }
  
  const isHealthy = dbStatus === 'connected' && 
                    (redisStatus === 'connected' || !isRedisActive()) && 
                    !queueStatus.includes('unhealthy');

  const health = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
      sockets: {
        status: socketsStatus,
        activeConnections: socketCount
      },
      queues: queueStatus
    },
    system: {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    }
  };

  if (isHealthy) {
    res.status(200).json(health);
  } else {
    res.status(500).json(health);
  }
});

const { generalLimiter } = require('./middleware/rateLimiter');

// Per-Route payload limits (Fix 10)
app.use('/api/auth/login', express.json({ limit: '50kb' }));
app.use('/api/auth/send-otp', express.json({ limit: '10kb' }));
app.use('/api/admin', express.json({ limit: '500kb' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// APM and DDoS Mitigation Middleware
const apmAndDdosMiddleware = require('./middleware/apmMiddleware');
const emergencyModeGuard = require('./middleware/emergencyModeGuard');

app.use('/api', emergencyModeGuard);
app.use('/api', apmAndDdosMiddleware);

// Threat Intelligence Filtering Middleware
const threatIntelMiddleware = require('./middleware/threatIntelMiddleware');
app.use('/api', threatIntelMiddleware);

// General Rate Limiter (Fix 1)
app.use('/api', generalLimiter);

// DEBUG LOGGER
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
// app.use('/api/users', require('./routes/userRoutes')); // Removed: File does not exist
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin/incidents', require('./routes/incidentRoutes'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/interests', require('./routes/interestRoutes')); // NEW Interest Logic
app.use('/api/seller', require('./routes/sellerRoutes'));
app.use('/api/seller/revenue-intelligence', require('./routes/revenueIntelligenceRoutes'));
app.use('/api/seller/event-intelligence', require('./routes/eventIntelligenceRoutes'));
app.use('/api/seller/growth-advisor', require('./routes/growthAdvisorRoutes'));
app.use('/api/seller/hyperlocal', require('./routes/hyperlocalRoutes'));
app.use('/api/admin/hyperlocal', require('./routes/hyperlocalRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/master', require('./routes/masterRoutes')); // New Mount
app.use('/api', require('./routes/creationRoutes')); // Mount Creator & Creations routes
app.use('/api/chat', require('./routes/chatRoutes')); // Mount unified chat routes
app.use('/api/analytics', require('./routes/generalAnalyticsRoutes'));
app.use('/api/ai', require('./routes/aiSearchRoutes'));
app.use('/api/copilot', require('./routes/copilotRoutes'));
app.use('/api/forecast', require('./routes/forecastRoutes'));
app.use('/api/inventory-forecast', require('./routes/inventoryForecastRoutes'));

// Mount direct endpoint for compatibility
const { getSellerForecast } = require('./controllers/forecastController');
const { getInventoryForecast } = require('./controllers/inventoryForecastController');
const { protect, authorize } = require('./middleware/authMiddleware');
app.get('/api/seller/forecast', protect, authorize('seller'), getSellerForecast);
app.get('/api/seller/inventory-forecast', protect, authorize('seller'), getInventoryForecast);

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
app.use('/api/commerce', require('./routes/commerceRoutes')); // NEW Autonomous Commerce System (Phase 6)
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/customer', require('./routes/customerRoutes')); // Customer Panel Routes
app.use('/api/test', require('./routes/testApi'));
app.use('/api/catalog', require('./routes/catalogRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/seller/analytics', require('./routes/analyticsRoutes'));
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
connectDB().then(async () => {
  // PM2/Crash loop restart check
  const { isRedisActive, getRedisClient } = require('./config/redis');
  if (isRedisActive()) {
    try {
      const redis = getRedisClient();
      const today = new Date().toISOString().split('T')[0];
      const restartKey = `node:restarts:${today}`;
      const restarts = await redis.incr(restartKey);
      await redis.expire(restartKey, 86400 * 2); // 2 days TTL
      console.log(`[Startup] Server startup count for today: ${restarts}`);
      if (restarts > 3) {
        const alertMsg = `[StartupAlert] Node PID ${process.pid} has restarted ${restarts} times in the last 24 hours. Potential crash loop detected!`;
        console.error(alertMsg);
        const { sendSecurityAlert } = require('./utils/alertDispatcher');
        await sendSecurityAlert({
          title: 'PM2 Restart Loop Warning',
          message: alertMsg,
          risk: 'high',
          event: 'RESTART_LOOP_ALERT',
          details: { pid: process.pid, restarts, date: today }
        }).catch(err => console.error('Failed to send restart loop alert:', err.message));
      }
    } catch (err) {
      console.error('[Startup] Failed to increment restart counter in Redis:', err.message);
    }
  }

  await initEventBus();
  const { catchUpEvents } = require('./utils/eventBus');
  await catchUpEvents().catch(err => console.error('[EventBus-Catchup] Error:', err.message));
  await initQueues();
  
  // Seed Event Intelligence data
  const { seedEventIntelligenceData } = require('./services/eventIntelligenceService');
  await seedEventIntelligenceData().catch(err => console.error('[Event-Seed] Error:', err.message));

  runRequestScheduler(); // Move inside DB block (Self-disables in production)
  startStockScheduler(); // Initialize Daily Stock Reset Job (Self-disables in production)
  startNotificationScheduler(); // Initialize Recurring Notifications (Self-disables in production)
  startSubscriptionScheduler(); // Initialize Subscription Expiry Checks (Self-disables in production)
  startImageCleanupScheduler(); // Initialize Image Cleanup Job (Self-disables in production)
  const { startInfraMonitor } = require('./services/infraMonitor');
  startInfraMonitor();
  const http = require('http');
  const httpServer = http.createServer(app);
  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
  initSocket(httpServer);
});
