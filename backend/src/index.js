'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
const http = require('http');
const path = require('path');

const logger = require('./lib/logger');
const config = require('./lib/config');
const { pool, connectWithRetry } = require('./db/pool');
const { migrate } = require('./db/migrate');
const { migrateV2 } = require('./db/migrate-v2');
const { migrateV3Trade } = require('./db/migrate-v3-trade');
const { setupWebSocket } = require('./services/websocket');
const { initRedis } = require('./services/cache');
const { auditMiddleware } = require('./services/audit');
const { requestId } = require('./middleware/requestId');
const { sanitize } = require('./middleware/sanitize');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { marketplaceWriteLimiter, auctionBidLimiter, paymentLimiter, negotiationLimiter, searchLimiter, iotIngestionLimiter } = require('./middleware/rateLimiters');

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
const adminRouter = require('./routes/admin');
const farmdiaryRouter = require('./routes/farmdiary');
const jobsRouter = require('./routes/jobs');
const trainingRouter = require('./routes/training');
const schemesRouter = require('./routes/schemes');
const walletRouter = require('./routes/wallet');
const schemeDiscoveryRouter = require('./routes/schemediscovery');
const cropDoctorRouter = require('./routes/cropdoctor');
const escrowRouter = require('./routes/escrow');
const subscriptionsRouter = require('./routes/subscriptions');
const watchlistsRouter = require('./routes/watchlists');
const favoritesRouter = require('./routes/favorites');
const ticketsRouter = require('./routes/tickets');
const tradeRouter = require('./routes/trade');
const healthRouter = require('./routes/health');
const translateRouter = require('./routes/translate');
const settingsRouter = require('./routes/settings');
const verificationRouter = require('./routes/verification');
const cartRouter = require('./routes/cart');
const sellerRouter = require('./routes/seller');
const livestockRouter = require('./routes/livestock');
const bookingRouter = require('./routes/booking');
const logisticsRouter = require('./routes/logistics');
const inputsRouter = require('./routes/inputs');
const cropplanningRouter = require('./routes/cropplanning');
const onboardingRouter = require('./routes/onboarding');
// Phase 2-4 routes
const contractsRouter = require('./routes/contracts');
const trustscoreRouter = require('./routes/trustscore');
const satelliteRouter = require('./routes/satellite');
const financeRouter = require('./routes/finance');
const agentsRouter = require('./routes/agents');
const bankportalRouter = require('./routes/bankportal');
const governmentRouter = require('./routes/government');
const exporterRouter = require('./routes/exporter');
const openapiRouter = require('./routes/openapi');
const executionRouter = require('./routes/execution');
// Phase 5 — KisanConnect 2.0 Rural Operating System
const vehiclesRouter = require('./routes/vehicles');
const deliveryRouter = require('./routes/delivery');
const gigworkersRouter = require('./routes/gigworkers');
const transportRouter = require('./routes/transport');
// Phase 6 — AquaOS V2 Full Ecosystem
const aquaosV2Router = require('./routes/aquaos-v2');
// Phase 7 — AquaOS V3 RFQ + Escrow + Forecasting
const aquaosV3Router = require('./routes/aquaos-v3');
// Phase 8 — AquaOS V4 Culture Units + Harvest Optimizer + IoT + Trust
const aquaosV4Router = require('./routes/aquaos-v4');
// Phase 9 — AquaOS V5 Advanced KPI Engine + Predictive Models + Supply Marketplace
const aquaosV5Router = require('./routes/aquaos-v5');
// Phase 10 — AquaOS V6 Fish Marketplace + Cold Chain + Traceability + PMMSY DPR + Supplier Directory
const aquaosV6Router = require('./routes/aquaos-v6');
// Phase 11 — AquaOS V7 Reviews + Logistics+ + Training + ODR + Trade Credit + VMS
const aquaosV7Router = require('./routes/aquaos-v7');
// Phase 12 — AquaOS V8 Role-Based Ecosystem (Crop Posts + Community + Supply Forecast + Leads)
const aquaosV8Router = require('./routes/aquaos-v8');
// Phase 13 — AquaOS V9 Privacy + Admin Panel + Negotiation + Insights + Security
const aquaosV9Router = require('./routes/aquaos-v9');
// Phase 14 — AquaOS V10 Analytics + Search + Payments + Pricing + Chat + AI + Growth + IoT
const aquaosV10Router = require('./routes/aquaos-v10');
// Phase 15 — Galaxy Discovery Module
const galaxyRouter = require('./routes/galaxy');
// Phase 16 — Platform Readiness (DPDP + KYC + AI + eNAM/NABARD/SFAC)
const complianceRouter = require('./routes/compliance');
const kycRouter = require('./routes/kyc');
const aiPredictionsRouter = require('./routes/ai-predictions');
const enamRouter = require('./routes/enam');
// Phase 17 — AquaOS V11 Supply Chain + Warehouse Management
const aquaosV11Router = require('./routes/aquaos-v11');
const warehouseRouter = require('./routes/warehouse');

const app = express();
const server = http.createServer(app);

// ─── Security Middleware ─────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: config.isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS: restricted in production, permissive in dev
const corsOptions = config.isProduction
  ? { origin: config.cors.origins, credentials: true, optionsSuccessStatus: 200 }
  : { origin: 'http://localhost:3000', credentials: true };
app.use(cors(corsOptions));

// Prevent HTTP parameter pollution
app.use(hpp());

// ─── Request Processing ──────────────────────────────────────
app.use(requestId);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitize);
app.use(auditMiddleware);

// ─── Structured HTTP Logging ─────────────────────────────────
app.use(pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url === '/health' },
  customProps: (req) => ({ requestId: req.id }),
  redact: ['req.headers.authorization', 'req.headers.cookie'],
}));

// ─── Rate Limiting ───────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.global.windowMs,
  max: config.rateLimit.global.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later' } },
});
app.use('/api/', globalLimiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many authentication attempts' } },
});
app.use('/api/auth/send-otp', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);

// Per-route rate limits for AquaOS sensitive endpoints
app.use('/api/aquaos-v6/listings', marketplaceWriteLimiter);
app.use('/api/aquaos-v6/auctions', auctionBidLimiter);
app.use('/api/aquaos-v9/negotiations', negotiationLimiter);
app.use('/api/aquaos-v10/payments', paymentLimiter);
app.use('/api/aquaos-v10/search', searchLimiter);
app.use('/api/aquaos-v10/iot', iotIngestionLimiter);

// ─── Health Check ────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;

    res.json({
      status: 'ok',
      service: 'AgriHub API',
      version: '1.0.0',
      environment: config.env,
      uptime: Math.round(process.uptime()),
      db: { status: 'connected', latencyMs: dbLatency },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      db: { status: 'disconnected', error: err.message },
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/agriflow', agriflowRouter);
app.use('/api/aquaos', aquaosRouter);
app.use('/api/aquaos-v2', aquaosV2Router);
app.use('/api/aquaos-v3', aquaosV3Router);
app.use('/api/aquaos-v4', aquaosV4Router);
app.use('/api/aquaos-v5', aquaosV5Router);
app.use('/api/aquaos-v6', aquaosV6Router);
app.use('/api/aquaos-v7', aquaosV7Router);
app.use('/api/aquaos-v8', aquaosV8Router);
app.use('/api/aquaos-v9', aquaosV9Router);
app.use('/api/aquaos-v10', aquaosV10Router);
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
app.use('/api/admin', adminRouter);
app.use('/api/farmdiary', farmdiaryRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/training', trainingRouter);
app.use('/api/schemes', schemesRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/scheme-discovery', schemeDiscoveryRouter);
app.use('/api/crop-doctor', cropDoctorRouter);
app.use('/api/escrow', escrowRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/watchlists', watchlistsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/trade', tradeRouter);
app.use('/api/health', healthRouter);
app.use('/api/translate', translateRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/cart', cartRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/livestock', livestockRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/logistics', logisticsRouter);
app.use('/api/inputs', inputsRouter);
app.use('/api/cropplan', cropplanningRouter);
app.use('/api/onboarding', onboardingRouter);
// Phase 2-4
app.use('/api/contracts', contractsRouter);
app.use('/api/trustscore', trustscoreRouter);
app.use('/api/satellite', satelliteRouter);
app.use('/api/finance', financeRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/bankportal', bankportalRouter);
app.use('/api/government', governmentRouter);
app.use('/api/exporter', exporterRouter);
app.use('/api/openapi', openapiRouter);
app.use('/api/execution', executionRouter);
// Phase 5 — KisanConnect 2.0 ROS
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/delivery', deliveryRouter);
app.use('/api/gigworkers', gigworkersRouter);
app.use('/api/transport', transportRouter);
// Phase 15 — Galaxy Discovery (public, no auth)
app.use('/api/galaxy', galaxyRouter);
// Phase 16 — Platform Readiness Layer
app.use('/api/compliance', complianceRouter);
app.use('/api/kyc', kycRouter);
app.use('/api/ai', aiPredictionsRouter);
app.use('/api/enam', enamRouter);
// Phase 17 — AquaOS V11 + Warehouse
app.use('/api/aquaos-v11', aquaosV11Router);
app.use('/api/warehouse', warehouseRouter);

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Error Handling ──────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Startup ─────────────────────────────────────────────────
async function start() {
  try {
    // Connect to DB with retry
    await connectWithRetry(config.db.retryAttempts, config.db.retryDelay);

    // Initialize Redis cache
    await initRedis();

    // Run migrations
    await migrate();
    await migrateV2();
    await migrateV3Trade();
    const { migrateV4 } = require('./db/migrate-v4-infrastructure');
    await migrateV4();
    const { migrateV5 } = require('./db/migrate-v5-platform');
    await migrateV5();
    const { migrateV6 } = require('./db/migrate-v6-farmerson');
    await migrateV6();
    const { migrateV6AgriOS } = require('./db/migrate-v6-agrios');
    await migrateV6AgriOS();
    const { migrateV7 } = require('./db/migrate-v7-intelligence');
    await migrateV7();
    const { migrateV8 } = require('./db/migrate-v8-finance');
    await migrateV8();
    const { migrateV9 } = require('./db/migrate-v9-ecosystem');
    await migrateV9();
    const { migrateV10ROS } = require('./db/migrate-v10-ros');
    await migrateV10ROS();
    const { migrateV15AquaOSV6 } = require('./db/migrate-v15-aquaos-v6');
    await migrateV15AquaOSV6();
    const { migrateV16AquaOSV7 } = require('./db/migrate-v16-aquaos-v7');
    await migrateV16AquaOSV7();
    const { migrateV17AquaOSV8 } = require('./db/migrate-v17-aquaos-v8');
    await migrateV17AquaOSV8();
    const { migrateV18AquaOSV9 } = require('./db/migrate-v18-aquaos-v9');
    await migrateV18AquaOSV9();
    const { migrateV19AquaOSV10 } = require('./db/migrate-v19-aquaos-v10');
    await migrateV19AquaOSV10();
    const { migrateV21Galaxy } = require('./db/migrate-v21-galaxy');
    await migrateV21Galaxy();
    const { migrateV22PlatformReadiness } = require('./db/migrate-v22-platform-readiness');
    await migrateV22PlatformReadiness();
    const { migrateV23AquaOSV11 } = require('./db/migrate-v23-aquaos-v11');
    await migrateV23AquaOSV11();
    const { migrateV24Warehouse } = require('./db/migrate-v24-warehouse');
    await migrateV24Warehouse();
    logger.info('Database migrations applied');

    // Recover any pending jobs from previous crash
    const { recoverPendingJobs } = require('./services/queue');
    recoverPendingJobs().catch(() => {});

    // WebSocket
    setupWebSocket(server);

    // Background scheduler
    const { startScheduler } = require('./scheduler');
    startScheduler();

    server.listen(config.port, () => {
      logger.info({
        port: config.port,
        env: config.env,
        pid: process.pid,
      }, `AgriHub API Server running on port ${config.port}`);
    });
  } catch (err) {
    logger.fatal({ err }, 'Startup failed');
    process.exit(1);
  }
}

// ─── Graceful Shutdown ───────────────────────────────────────
function gracefulShutdown(signal) {
  logger.info({ signal }, 'Shutdown signal received, closing gracefully...');

  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      const { disconnect } = require('./services/cache');
      await disconnect();
      await pool.end();
      logger.info('Database pool closed');
    } catch (err) {
      logger.error({ err }, 'Error closing connections');
    }
    process.exit(0);
  });

  // Force shutdown after 30s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled rejection');
  process.exit(1);
});

start();
