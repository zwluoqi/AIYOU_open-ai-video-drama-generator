/**
 * 数据库连接管理
 */
import knex from 'knex';
import dotenv from 'dotenv';
dotenv.config();

let db = null;

export function getDB() {
  if (!db) {
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
  return db;
}

export async function closeDB() {
  if (db) {
    await db.destroy();
    db = null;
  }
}
