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
  conversations: [],
  memories: [],
  routines: [],
  tasks: [],
  goals: [],
  expenses: [],
  notices: [],
  summaries: []
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

class PostgresDB {
  constructor() {
    this.store = structuredClone(freshInitialData);
    this.ready = this.initialize();
    this.writeQueue = Promise.resolve();
  }

  async initialize() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is missing.');
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS daysync_store (
        id INTEGER PRIMARY KEY,
        data JSONB NOT NULL
      )
    `);

    const result = await pool.query(
      'SELECT data FROM daysync_store WHERE id = 1'
    );

    if (result.rows.length > 0) {
      this.store = result.rows[0].data;
      console.log('DaySync PostgreSQL database loaded.');
      return;
    }

    // First-time setup:
    // Try to migrate existing local JSON data.
    let initialData = structuredClone(freshInitialData);

    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        initialData = JSON.parse(content);
        console.log('Existing data_store.json found. Migrating data to PostgreSQL...');
      }
    } catch (error) {
      console.error('Could not read existing data_store.json:', error);
    }

    await pool.query(
      `
      INSERT INTO daysync_store (id, data)
      VALUES (1, $1::jsonb)
      `,
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

    // Queue writes so multiple requests don't write at the same time.
    this.writeQueue = this.writeQueue
      .then(async () => {
        await this.ready;

        await pool.query(
          `
          INSERT INTO daysync_store (id, data)
          VALUES (1, $1::jsonb)
          ON CONFLICT (id)
          DO UPDATE SET data = EXCLUDED.data
          `,
          [JSON.stringify(this.store)]
        );
      })
      .catch(error => {
        console.error('PostgreSQL write error:', error);
      });

    return this.writeQueue;
  }

  async clearAll() {
    await this.ready;

    this.store = structuredClone(freshInitialData);

    await pool.query(
      `
      INSERT INTO daysync_store (id, data)
      VALUES (1, $1::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET data = EXCLUDED.data
      `,
      [JSON.stringify(this.store)]
    );
  }
}

export const db = new PostgresDB();