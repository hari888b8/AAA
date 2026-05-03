const WebSocket = require('ws');
const { query } = require('../db/pool');
const logger = require('../lib/logger');
const { get: cacheGet, set: cacheSet } = require('../services/cache');

let wss = null;
const clients = new Map(); // userId -> Set<ws>
const subscriptions = new Map(); // userId -> Set<channel>
const rooms = new Map(); // roomName -> Set<ws> (for targeted broadcasting)

function setupWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    logger.info('[WS] Client connected');
    ws.userId = null;
    ws.isAlive = true;

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'auth' && msg.userId) {
          ws.userId = msg.userId;
          if (!clients.has(msg.userId)) clients.set(msg.userId, new Set());
          clients.get(msg.userId).add(ws);
          ws.send(JSON.stringify({ type: 'auth_ok', userId: msg.userId }));
          logger.info(`[WS] Authenticated: ${msg.userId}`);
        }
        if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));

        // Subscribe to price channels (crops/districts)
        if (msg.type === 'subscribe' && msg.channels) {
          if (!subscriptions.has(ws.userId)) subscriptions.set(ws.userId, new Set());
          const subs = subscriptions.get(ws.userId);
          msg.channels.forEach(ch => {
            subs.add(ch);
            // Also add to room-based tracking
            if (!rooms.has(ch)) rooms.set(ch, new Set());
            rooms.get(ch).add(ws);
          });
          ws.send(JSON.stringify({ type: 'subscribed', channels: Array.from(subs) }));
        }

        // Unsubscribe from channels
        if (msg.type === 'unsubscribe' && msg.channels) {
          const subs = subscriptions.get(ws.userId);
          if (subs) msg.channels.forEach(ch => {
            subs.delete(ch);
            if (rooms.has(ch)) rooms.get(ch).delete(ws);
          });
        }

        // Join a room (for group chat, auction, etc.)
        if (msg.type === 'join_room' && msg.room) {
          if (!rooms.has(msg.room)) rooms.set(msg.room, new Set());
          rooms.get(msg.room).add(ws);
          ws.send(JSON.stringify({ type: 'room_joined', room: msg.room }));
        }

        // Leave a room
        if (msg.type === 'leave_room' && msg.room) {
          if (rooms.has(msg.room)) rooms.get(msg.room).delete(ws);
        }
      } catch (e) {
        logger.warn('[WS] Parse error:', e.message);
      }
    });

    ws.on('close', () => {
      if (ws.userId && clients.has(ws.userId)) {
        clients.get(ws.userId).delete(ws);
        if (clients.get(ws.userId).size === 0) {
          clients.delete(ws.userId);
          subscriptions.delete(ws.userId);
        }
      }
      // Clean up room memberships
      for (const [roomName, members] of rooms.entries()) {
        members.delete(ws);
        if (members.size === 0) rooms.delete(roomName);
      }
    });

    // Send welcome
    ws.send(JSON.stringify({ type: 'connected', message: 'AgriHub WebSocket ready' }));
  });

  // Heartbeat: kill dead connections
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heartbeat));

  // ── Price Ticker: broadcast live prices from DB ──
  startPriceTicker();

  // ── Activity Feed: poll DB for new events ──
  startActivityBroadcast();

  // ── Trade Order Updates: notify on status changes ──
  startTradeUpdatesBroadcast();

  logger.info('[WS] WebSocket server running on /ws');
  return wss;
}

// Broadcast to ALL connected clients
function broadcast(data) {
  if (!wss) return;
  const msg = JSON.stringify(data);
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

// Broadcast to specific user
function sendToUser(userId, data) {
  if (!clients.has(userId)) return;
  const msg = JSON.stringify(data);
  clients.get(userId).forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

// Broadcast to users subscribed to specific channels
function broadcastToChannel(channel, data) {
  // Use room-based approach for efficiency
  if (rooms.has(channel)) {
    const msg = JSON.stringify(data);
    rooms.get(channel).forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
    return;
  }

  // Fallback to subscription-based
  const msg = JSON.stringify(data);
  for (const [userId, subs] of subscriptions.entries()) {
    if (subs.has(channel) && clients.has(userId)) {
      clients.get(userId).forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg);
      });
    }
  }
}

// Broadcast to a specific room (e.g., auction room, chat group)
function broadcastToRoom(room, data, excludeWs = null) {
  if (!rooms.has(room)) return;
  const msg = JSON.stringify(data);
  rooms.get(room).forEach((ws) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

// Get connection stats for monitoring
function getConnectionStats() {
  return {
    total_connections: wss ? wss.clients.size : 0,
    authenticated_users: clients.size,
    active_rooms: rooms.size,
    active_subscriptions: subscriptions.size,
  };
}

// ══════════════════════════════════════════════════════════════
// PRICE TICKER — Real APMC data from DB + simulation
// In production: Poll real APMC/eNAM APIs and store to price_feeds table
// ══════════════════════════════════════════════════════════════

const CROPS = [
  { name: 'Tomato',    base: 2200, crop_id: null },
  { name: 'Onion',     base: 1800, crop_id: null },
  { name: 'Potato',    base: 1400, crop_id: null },
  { name: 'Rice',      base: 3200, crop_id: null },
  { name: 'Wheat',     base: 2800, crop_id: null },
  { name: 'Chilli',    base: 8500, crop_id: null },
  { name: 'Groundnut', base: 5200, crop_id: null },
  { name: 'Cotton',    base: 6800, crop_id: null },
];

function startPriceTicker() {
  // First, try to load real prices from DB
  loadDBPrices();

  setInterval(async () => {
    // Try to fetch latest prices from DB (updated by APMC scraper/scheduler)
    const dbPrices = await getLatestPricesFromDB();

    if (dbPrices && dbPrices.length > 0) {
      broadcast({
        type: 'price_update',
        source: 'apmc_db',
        prices: dbPrices,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Fallback: Simulated prices (with realistic fluctuation)
      const prices = CROPS.map(c => {
        const change = (Math.random() - 0.48) * c.base * 0.03; // ±3% max
        const price = Math.max(100, Math.round(c.base + change));
        const pct = ((change / c.base) * 100).toFixed(1);
        return { crop: c.name, price, unit: '₹/qtl', change_pct: parseFloat(pct), up: change >= 0 };
      });

      broadcast({ type: 'price_update', source: 'simulated', prices, timestamp: new Date().toISOString() });
    }
  }, 5000);
}

async function loadDBPrices() {
  try {
    const result = await query(`
      SELECT cc.id, cc.name FROM crop_catalog cc LIMIT 20
    `);
    result.rows.forEach((row, i) => {
      if (i < CROPS.length) CROPS[i].crop_id = row.id;
    });
  } catch (_) {}
}

async function getLatestPricesFromDB() {
  try {
    const result = await query(`
      SELECT DISTINCT ON (pf.crop_id)
        cc.name as crop, pf.price_per_quintal as price, 
        d.name as market,
        pf.recorded_at,
        COALESCE(
          ROUND(((pf.price_per_quintal - LAG(pf.price_per_quintal) OVER (PARTITION BY pf.crop_id ORDER BY pf.recorded_at)) 
          / NULLIF(LAG(pf.price_per_quintal) OVER (PARTITION BY pf.crop_id ORDER BY pf.recorded_at), 0)) * 100, 1),
          0
        ) as change_pct
      FROM price_feeds pf
      JOIN crop_catalog cc ON cc.id = pf.crop_id
      LEFT JOIN districts d ON d.id = pf.district_id
      WHERE pf.recorded_at > NOW() - INTERVAL '24 hours'
      ORDER BY pf.crop_id, pf.recorded_at DESC
      LIMIT 15
    `);

    if (result.rows.length === 0) return null;

    return result.rows.map(r => ({
      crop: r.crop,
      price: parseInt(r.price),
      market: r.market || 'APMC',
      unit: '₹/qtl',
      change_pct: parseFloat(r.change_pct || 0),
      up: parseFloat(r.change_pct || 0) >= 0,
      recorded_at: r.recorded_at,
    }));
  } catch (_) {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════
// ACTIVITY FEED — Real-time updates
// ══════════════════════════════════════════════════════════════

let lastActivityId = null;

async function startActivityBroadcast() {
  try {
    const r = await query(`SELECT id FROM activity_feed ORDER BY created_at DESC LIMIT 1`);
    if (r.rows.length) lastActivityId = r.rows[0].id;
  } catch (_) {}

  setInterval(async () => {
    try {
      let result;
      if (lastActivityId) {
        result = await query(`
          SELECT * FROM activity_feed
          WHERE ctid > (SELECT ctid FROM activity_feed WHERE id = $1)
          ORDER BY created_at DESC LIMIT 10
        `, [lastActivityId]);
      } else {
        result = await query(`SELECT * FROM activity_feed ORDER BY created_at DESC LIMIT 5`);
      }

      if (result.rows.length) {
        lastActivityId = result.rows[0].id;
        broadcast({ type: 'activity', activities: result.rows });
      }
    } catch (_) {}
  }, 10000);
}

// ══════════════════════════════════════════════════════════════
// TRADE ORDER STATUS CHANGES — Notify buyer/seller in real-time
// ══════════════════════════════════════════════════════════════

let lastTradeCheckTime = new Date();

function startTradeUpdatesBroadcast() {
  setInterval(async () => {
    try {
      const result = await query(`
        SELECT to2.id, to2.status, to2.buyer_id, to2.seller_id, to2.updated_at,
               cc.name as crop_name
        FROM trade_orders to2
        JOIN trade_listings tl ON tl.id = to2.listing_id
        LEFT JOIN crop_catalog cc ON cc.id = tl.crop_id
        WHERE to2.updated_at > $1
        ORDER BY to2.updated_at DESC
        LIMIT 20
      `, [lastTradeCheckTime]);

      lastTradeCheckTime = new Date();

      for (const order of result.rows) {
        // Notify buyer
        sendToUser(order.buyer_id, {
          type: 'trade_update',
          order_id: order.id,
          status: order.status,
          crop_name: order.crop_name,
          message: `Order ${order.status.replace('_', ' ')}`,
        });
        // Notify seller
        sendToUser(order.seller_id, {
          type: 'trade_update',
          order_id: order.id,
          status: order.status,
          crop_name: order.crop_name,
          message: `Order ${order.status.replace('_', ' ')}`,
        });
      }
    } catch (_) {}
  }, 5000);
}

module.exports = { setupWebSocket, broadcast, sendToUser, broadcastToChannel, broadcastToRoom, getConnectionStats };
