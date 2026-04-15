import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'saferoute.db');

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    google_id TEXT,
    women_safety INTEGER DEFAULT 0,
    dark_mode INTEGER DEFAULT 1,
    voice_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  );

  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    origin_name TEXT,
    origin_lat REAL,
    origin_lng REAL,
    destination_name TEXT,
    destination_lat REAL,
    destination_lng REAL,
    total_distance REAL DEFAULT 0,
    total_time REAL DEFAULT 0,
    safety_score INTEGER DEFAULT 0,
    risk_low REAL DEFAULT 0,
    risk_medium REAL DEFAULT 0,
    risk_high REAL DEFAULT 0,
    alerts_received INTEGER DEFAULT 0,
    start_time DATETIME,
    end_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    description TEXT,
    upvotes INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(user_id);
  CREATE INDEX IF NOT EXISTS idx_reports_active ON reports(active);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
`);

export default db;
