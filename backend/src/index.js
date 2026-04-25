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
