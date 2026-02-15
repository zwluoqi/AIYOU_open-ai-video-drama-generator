/**
 * 数据库连接管理
 * 支持 PostgreSQL (Web 部署) 和 SQLite (桌面版 Tauri)
 */
import knex from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import fs from 'fs';
dotenv.config();

let db = null;

/**
 * 获取 SQLite 数据库文件路径
 * macOS: ~/Library/Application Support/com.aiyou.app/aiyou.db
 * Windows: %APPDATA%/com.aiyou.app/aiyou.db
 * Linux: ~/.local/share/com.aiyou.app/aiyou.db
 */
function getSqliteDbPath() {
  let dataDir;
  const platform = os.platform();
  if (platform === 'darwin') {
    dataDir = path.join(os.homedir(), 'Library', 'Application Support', 'com.aiyou.app');
  } else if (platform === 'win32') {
    dataDir = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'com.aiyou.app');
  } else {
    dataDir = path.join(os.homedir(), '.local', 'share', 'com.aiyou.app');
  }
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'aiyou.db');
}

const useSqlite = process.env.DB_CLIENT === 'sqlite' || process.env.TAURI_ENV_PLATFORM;

export function getDB() {
  if (!db) {
    if (useSqlite) {
      const dbPath = getSqliteDbPath();
      console.log(`[DB] Using SQLite: ${dbPath}`);
      db = knex({
        client: 'better-sqlite3',
        connection: { filename: dbPath },
        useNullAsDefault: true,
      });
    } else {
      db = knex({
        client: 'pg',
        connection: {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'aiyou',
        },
        pool: { min: 2, max: 10 },
      });
    }
  }
  return db;
}

export async function closeDB() {
  if (db) {
    await db.destroy();
    db = null;
  }
}
