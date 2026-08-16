import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'data_store.json');

const freshInitialData = {
  users: [],
  refreshTokens: [],
  conversations: [],
  memories: [],
  routines: [],
  tasks: [],
  goals: [],
  expenses: [],
  notices: [],
  summaries: []
};

// Simple JSON File DB Provider for local dev
class JsonDB {
  constructor() {
    this.ready = Promise.resolve();
  }

  read() {
    try {
      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(freshInitialData, null, 2));
        return structuredClone(freshInitialData);
      }
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading JSON DB file:', e);
      return structuredClone(freshInitialData);
    }
  }

  write(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Error writing JSON DB file:', e);
    }
  }
}

// PostgreSQL DB Provider for production
class PostgresDB {
  constructor() {
    this.store = structuredClone(freshInitialData);
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    this.ready = this.initialize();
    this.writeQueue = Promise.resolve();
  }

  async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS daysync_store (
        id INTEGER PRIMARY KEY,
        data JSONB NOT NULL
      )
    `);

    const result = await this.pool.query('SELECT data FROM daysync_store WHERE id = 1');

    if (result.rows.length > 0) {
      this.store = result.rows[0].data;
      console.log('DaySync PostgreSQL database loaded.');
      return;
    }

    let initialData = structuredClone(freshInitialData);
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        initialData = JSON.parse(content);
      }
    } catch (error) {}

    await this.pool.query(
      `INSERT INTO daysync_store (id, data) VALUES (1, $1::jsonb)`,
      [JSON.stringify(initialData)]
    );

    this.store = initialData;
    console.log('DaySync PostgreSQL database initialized.');
  }

  read() {
    return this.store;
  }

  write(data) {
    this.store = data;
    this.writeQueue = this.writeQueue
      .then(async () => {
        await this.ready;
        await this.pool.query(
          `INSERT INTO daysync_store (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
          [JSON.stringify(this.store)]
        );
      })
      .catch(error => console.error('PostgreSQL write error:', error));

    return this.writeQueue;
  }
}

export const db = process.env.DATABASE_URL ? new PostgresDB() : new JsonDB();