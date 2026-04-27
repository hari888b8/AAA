require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');

const { pool } = require('./db/pool');
const { migrate } = require('./db/migrate');
const { seed } = require('./db/seed');
const { setupWebSocket } = require('./services/websocket');

// Routes
const authRouter = require('./routes/auth');
const agriflowRouter = require('./routes/agriflow');
const aquaosRouter = require('./routes/aquaos');
const farmerconnectRouter = require('./routes/farmerconnect');
const kisanconnectRouter = require('./routes/kisanconnect');
const intelligenceRouter = require('./routes/intelligence');
const communityRouter = require('./routes/community');
const ordersRouter = require('./routes/orders');
const fpoRouter = require('./routes/fpo');
const buyerRouter = require('./routes/buyer');
const farmerRouter = require('./routes/farmer');
const weatherRouter = require('./routes/weather');
const uploadRouter = require('./routes/upload');
const { router: notificationsRouter } = require('./routes/pushnotifications');
const agrigalaxyRouter2 = require('./routes/agrigalaxy');
const bhoomiosRouter = require('./routes/bhoomios');
const paymentsRouter = require('./routes/payments');
const reviewsRouter = require('./routes/reviews');
const chatRouter = require('./routes/chat');
const trackingRouter = require('./routes/tracking');
const path = require('path');

const app = express();
const server = http.createServer(app);

// ─── Middleware ──────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 200, standardHeaders: true });
app.use('/api/', limiter);

// ─── Health ──────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      service: 'AgriHub API',
      version: '1.0.0',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/agriflow', agriflowRouter);
app.use('/api/aquaos', aquaosRouter);
app.use('/api/farmerconnect', farmerconnectRouter);
app.use('/api/kisanconnect', kisanconnectRouter);
app.use('/api/intelligence', intelligenceRouter);
app.use('/api/community', communityRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/fpo', fpoRouter);
app.use('/api/buyer', buyerRouter);
app.use('/api/farmer', farmerRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/agrigalaxy', agrigalaxyRouter2);
app.use('/api/bhoomios', bhoomiosRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/tracking', trackingRouter);

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 404
app.use((req, res) => res.status(404).json({ error: `Route ${req.path} not found` }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ─── Startup ─────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

async function start() {
  try {
    // Test DB connection
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');

    // Run migration
    await migrate();

    // Seed if needed
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      await seed();
      console.log('✅ Initial seed complete');
    }

    // WebSocket
    setupWebSocket(server);

    server.listen(PORT, () => {
      console.log(`\n🌾 AgriHub API Server running on port ${PORT}`);
      console.log(`   REST API: http://localhost:${PORT}/api`);
      console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
      console.log(`   Health:   http://localhost:${PORT}/health\n`);
    });
  } catch (err) {
    console.error('❌ Startup failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

start();
