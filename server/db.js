import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data_store.json');

// Completely clean empty initial database template
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

class LocalDB {
  constructor() {
    this.ensureDbExists();
  }

  ensureDbExists() {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(freshInitialData, null, 2), 'utf-8');
    }
  }

  read() {
    try {
      this.ensureDbExists();
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading JSON DB, resetting store:', e);
      return freshInitialData;
    }
  }

  write(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing JSON DB:', e);
    }
  }

  clearAll() {
    fs.writeFileSync(DB_FILE, JSON.stringify(freshInitialData, null, 2), 'utf-8');
  }
}

export const db = new LocalDB();
