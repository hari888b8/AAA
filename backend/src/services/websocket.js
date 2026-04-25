const WebSocket = require('ws');
const { query } = require('../db/pool');

let wss = null;
const clients = new Map(); // userId -> Set<ws>

function setupWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('[WS] Client connected');
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
          console.log(`[WS] Authenticated: ${msg.userId}`);
        }
        if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
      } catch (e) {
        console.error('[WS] Parse error:', e.message);
      }
    });

    ws.on('close', () => {
      if (ws.userId && clients.has(ws.userId)) {
        clients.get(ws.userId).delete(ws);
        if (clients.get(ws.userId).size === 0) clients.delete(ws.userId);
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

  // ── Price Ticker: broadcast live prices every 5 seconds ──
  startPriceTicker();

  // ── Activity Feed: poll DB for new events every 10 seconds ──
  startActivityBroadcast();

  console.log('[WS] WebSocket server running on /ws');
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

// Price ticker simulation (in production: poll APMC API)
const CROPS = [
  { name: 'Tomato',   base: 2200 },
  { name: 'Onion',    base: 1800 },
  { name: 'Potato',   base: 1400 },
  { name: 'Rice',     base: 3200 },
  { name: 'Wheat',    base: 2800 },
  { name: 'Chilli',   base: 8500 },
  { name: 'Groundnut',base: 5200 },
  { name: 'Cotton',   base: 6800 },
];

function startPriceTicker() {
  setInterval(() => {
    const prices = CROPS.map(c => {
      const change = (Math.random() - 0.48) * c.base * 0.05;
      const price = Math.max(100, Math.round(c.base + change));
      const pct = ((change / c.base) * 100).toFixed(1);
      return { crop: c.name, price, unit: '₹/qtl', change_pct: parseFloat(pct), up: change >= 0 };
    });

    broadcast({ type: 'price_update', prices, timestamp: new Date().toISOString() });
  }, 5000);
}

// Activity feed broadcaster
let lastActivityId = null;

async function startActivityBroadcast() {
  // Get latest existing activity ID as baseline
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

module.exports = { setupWebSocket, broadcast, sendToUser };
