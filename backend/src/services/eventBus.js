'use strict';

/**
 * Event Bus Service — Moves architecture toward event-driven microservices
 * In production: Replace with Kafka/RabbitMQ. Current: In-process EventEmitter + PostgreSQL NOTIFY/LISTEN
 * Implements: Pub/Sub, Event Sourcing pattern, Dead Letter Queue
 */

const EventEmitter = require('events');
const { pool } = require('../db/pool');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
    this.deadLetterQueue = [];
    this.subscribers = new Map();
    this.metrics = {
      published: 0,
      delivered: 0,
      failed: 0,
      retried: 0,
    };
  }

  /**
   * Publish an event to all subscribers
   * @param {string} eventType - e.g. 'order.created', 'payment.completed'
   * @param {object} payload - Event data
   * @param {object} metadata - Additional context (userId, source, etc.)
   */
  async publish(eventType, payload, metadata = {}) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: eventType,
      payload,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: metadata.source || 'api',
      },
      published_at: new Date().toISOString(),
    };

    this.metrics.published++;

    // Persist event for audit/replay (event sourcing)
    try {
      await pool.query(`
        INSERT INTO event_store (event_id, event_type, payload, metadata, published_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [event.id, event.type, JSON.stringify(event.payload), JSON.stringify(event.metadata)]);
    } catch (err) {
      console.error('Event store write failed:', err.message);
    }

    // Emit to in-process subscribers
    this.emit(eventType, event);
    this.emit('*', event); // Wildcard subscribers

    // Notify via PostgreSQL NOTIFY for cross-process communication
    try {
      await pool.query(`SELECT pg_notify('events', $1)`, [JSON.stringify({ type: eventType, id: event.id })]);
    } catch (err) {
      // Non-critical
    }

    return event.id;
  }

  /**
   * Subscribe to an event type with error handling and retry
   */
  subscribe(eventType, handler, options = {}) {
    const { retries = 3, retryDelay = 1000 } = options;

    const wrappedHandler = async (event) => {
      let attempts = 0;
      while (attempts <= retries) {
        try {
          await handler(event);
          this.metrics.delivered++;
          return;
        } catch (err) {
          attempts++;
          this.metrics.retried++;
          if (attempts > retries) {
            this.metrics.failed++;
            this.deadLetterQueue.push({ event, error: err.message, failed_at: new Date().toISOString() });
            console.error(`Event handler failed after ${retries} retries:`, eventType, err.message);
            return;
          }
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
        }
      }
    };

    this.on(eventType, wrappedHandler);
    this.subscribers.set(`${eventType}:${handler.name || 'anonymous'}`, { eventType, handler: wrappedHandler });
  }

  /**
   * Get event bus health metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      dead_letter_queue_size: this.deadLetterQueue.length,
      active_subscribers: this.subscribers.size,
      listener_count: this.listenerCount('*'),
    };
  }

  /**
   * Replay events from event store (for rebuilding state)
   */
  async replay(eventType, since, handler) {
    const result = await pool.query(
      'SELECT * FROM event_store WHERE event_type = $1 AND published_at > $2 ORDER BY published_at',
      [eventType, since]
    );

    for (const row of result.rows) {
      await handler({
        id: row.event_id,
        type: row.event_type,
        payload: row.payload,
        metadata: row.metadata,
        published_at: row.published_at,
      });
    }

    return result.rows.length;
  }
}

// Singleton instance
const eventBus = new EventBus();

// ─── Register core event handlers ────────────────────────────

// Order lifecycle events
eventBus.subscribe('order.created', async (event) => {
  // Could trigger: notification, analytics update, inventory reservation
  console.log(`[EventBus] Order created: ${event.payload.orderId}`);
});

eventBus.subscribe('payment.completed', async (event) => {
  // Could trigger: seller notification, commission calculation, ledger update
  console.log(`[EventBus] Payment completed: ${event.payload.transactionId}`);
});

eventBus.subscribe('kyc.verified', async (event) => {
  // Could trigger: trust score update, feature unlock, congratulations notification
  console.log(`[EventBus] KYC verified for user: ${event.payload.userId}`);
});

eventBus.subscribe('trade.state_changed', async (event) => {
  // Could trigger: notification to counterparty, timeline update
  console.log(`[EventBus] Trade state: ${event.payload.oldState} → ${event.payload.newState}`);
});

module.exports = { eventBus };
