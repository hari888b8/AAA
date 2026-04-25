/**
 * AgriHub — One-time Database Setup
 *
 * Creates:  user "Agrihub" (password: postgres)
 *           database "Agrihub" owned by that user
 *
 * Usage:
 *   node setup-db.js                          ← uses POSTGRES_ADMIN_PASSWORD from .env
 *   node setup-db.js myActualPassword         ← pass password as argument
 *   node setup-db.js ""                       ← try with empty password (trust auth)
 */
require('dotenv').config();
const { Client } = require('pg');

const ADMIN_PASSWORD = process.argv[2] ?? (process.env.POSTGRES_ADMIN_PASSWORD || 'postgres');
const DB_HOST        = process.env.POSTGRES_HOST || 'localhost';
const DB_PORT        = parseInt(process.env.POSTGRES_PORT || '5432');

console.log(`\n🌾 AgriHub Database Setup`);
console.log(`   Host: ${DB_HOST}:${DB_PORT}`);
console.log(`   Connecting as: postgres\n`);

async function setup() {
  const admin = new Client({
    host:     DB_HOST,
    port:     DB_PORT,
    database: 'postgres',
    user:     'postgres',
    password: ADMIN_PASSWORD,
    connectionTimeoutMillis: 5000,
  });

  try {
    await admin.connect();
    console.log('✅ Connected to PostgreSQL as superuser\n');
  } catch (err) {
    console.error('❌ Could not connect as postgres superuser.');
    console.error('   Error:', err.message);
    console.error('\n📋 To fix, run one of these:');
    console.error('   node setup-db.js <your-postgres-password>');
    console.error('   OR use the pg_ctl / pgAdmin approach below:\n');
    printManualSteps();
    process.exit(1);
  }

  try {
    // 1. Create user
    await admin.query(`
      DO $$ BEGIN
        CREATE USER "Agrihub" WITH PASSWORD 'postgres' CREATEDB;
      EXCEPTION WHEN duplicate_object THEN
        ALTER USER "Agrihub" WITH PASSWORD 'postgres' CREATEDB;
        RAISE NOTICE 'User Agrihub already exists — password updated';
      END $$;
    `);
    console.log('✅ PostgreSQL user "Agrihub" (password: postgres) ready');

    // 2. Create database
    const dbExists = await admin.query(
      `SELECT 1 FROM pg_database WHERE datname = 'Agrihub'`
    );
    if (!dbExists.rows.length) {
      // Must be outside transaction
      await admin.query(`CREATE DATABASE "Agrihub" OWNER "Agrihub" ENCODING 'UTF8'`);
      console.log('✅ Database "Agrihub" created');
    } else {
      console.log('ℹ️  Database "Agrihub" already exists');
      await admin.query(`ALTER DATABASE "Agrihub" OWNER TO "Agrihub"`);
    }

    // 3. Grant all privileges
    await admin.query(`GRANT ALL PRIVILEGES ON DATABASE "Agrihub" TO "Agrihub"`);
    console.log('✅ Privileges granted\n');

    await admin.end();

    // 4. Run migration + seed
    console.log('🔧 Running schema migration...');
    const { migrate } = require('./src/db/migrate');
    await migrate();

    console.log('🌱 Seeding initial data...');
    const appPool = require('./src/db/pool');
    const cnt = await appPool.query('SELECT COUNT(*) FROM users');
    if (parseInt(cnt.rows[0].count) === 0) {
      const { seed } = require('./src/db/seed');
      await seed();
    } else {
      console.log('ℹ️  Data already seeded, skipping');
    }
    await appPool.pool.end();

    console.log('\n🚀 Setup complete!\n');
    console.log('   Start backend:  cd backend && npm start');
    console.log('   Start mobile:   cd mobile && npm start  (press A for Android)\n');

  } catch (err) {
    console.error('❌ Setup error:', err.message);
    await admin.end().catch(() => {});
    process.exit(1);
  }
}

function printManualSteps() {
  console.log('── Manual Setup via pgAdmin or SQL Shell ──────────────────');
  console.log('Open pgAdmin → Query Tool → run:');
  console.log('');
  console.log("  CREATE USER \"Agrihub\" WITH PASSWORD 'postgres' CREATEDB;");
  console.log("  CREATE DATABASE \"Agrihub\" OWNER \"Agrihub\";");
  console.log("  GRANT ALL PRIVILEGES ON DATABASE \"Agrihub\" TO \"Agrihub\";");
  console.log('');
  console.log('Then:  cd backend && npm start');
  console.log('────────────────────────────────────────────────────────────\n');
}

setup();
