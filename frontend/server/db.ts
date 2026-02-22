import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'dev.sqlite3');

let db: Database.Database | null = null;

export function getDB(): Database.Database {
  if (db) return db;

  fs.mkdirSync(DATA_DIR, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      auth_provider TEXT NOT NULL DEFAULT 'email',
      photo_url TEXT,
      password_hash TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      session_type TEXT NOT NULL,
      station_id TEXT,
      journey_type TEXT,
      started_at INTEGER NOT NULL,
      ended_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS user_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      browser_session_id TEXT NOT NULL,
      prompt_session_id TEXT,
      timestamp INTEGER NOT NULL,
      properties TEXT NOT NULL DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_user_events_session ON user_events(browser_session_id);
    CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_user_events_timestamp ON user_events(timestamp);

    CREATE TABLE IF NOT EXISTS prompt_logs (
      request_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      method TEXT NOT NULL,
      session_type TEXT NOT NULL,
      model_name TEXT NOT NULL,
      system_prompt TEXT NOT NULL,
      user_message TEXT NOT NULL,
      chat_history TEXT NOT NULL,
      raw_response TEXT NOT NULL,
      structured_response TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT,
      latency_ms INTEGER NOT NULL,
      retry_count INTEGER NOT NULL,
      request_timestamp INTEGER NOT NULL,
      response_timestamp INTEGER NOT NULL,
      token_count_estimate INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id)
    );
  `);

  return db;
}
