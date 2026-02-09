/**
 * AIYOU 数据库迁移脚本
 * 用法: node db/migrate.js
 */
import knex from 'knex';
import dotenv from 'dotenv';
dotenv.config();

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'aiyou',
  },
});

async function migrate() {
  console.log('🔄 开始数据库迁移...');

  // projects 表
  if (!(await db.schema.hasTable('projects'))) {
    await db.schema.createTable('projects', (t) => {
      t.uuid('id').primary();
      t.string('title', 255).notNullable().defaultTo('未命名项目');
      t.jsonb('settings').defaultTo('{}');
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.timestamp('updated_at').defaultTo(db.fn.now());
    });
    console.log('  ✅ projects 表已创建');
  }

  // nodes 表
  if (!(await db.schema.hasTable('nodes'))) {
    await db.schema.createTable('nodes', (t) => {
      t.uuid('id').primary();
      t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
      t.string('type', 50).notNullable();
      t.string('title', 255).defaultTo('');
      t.float('x').defaultTo(0);
      t.float('y').defaultTo(0);
      t.float('width').defaultTo(420);
      t.float('height').defaultTo(360);
      t.string('status', 20).defaultTo('IDLE');
      t.jsonb('data').defaultTo('{}');
      t.specificType('inputs', 'text[]').defaultTo('{}');
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.timestamp('updated_at').defaultTo(db.fn.now());
      t.index('project_id');
      t.index('type');
    });
    console.log('  ✅ nodes 表已创建');
  }

  // connections 表
  if (!(await db.schema.hasTable('connections'))) {
    await db.schema.createTable('connections', (t) => {
      t.uuid('id').primary();
      t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
      t.uuid('from_node').references('id').inTable('nodes').onDelete('CASCADE');
      t.uuid('to_node').references('id').inTable('nodes').onDelete('CASCADE');
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.index('project_id');
    });
    console.log('  ✅ connections 表已创建');
  }

  // media_files 表
  if (!(await db.schema.hasTable('media_files'))) {
    await db.schema.createTable('media_files', (t) => {
      t.uuid('id').primary();
      t.uuid('node_id').references('id').inTable('nodes').onDelete('CASCADE');
      t.string('type', 20).notNullable(); // image, video, audio
      t.string('storage_type', 20).defaultTo('local'); // local, oss
      t.text('file_path'); // local path or OSS key
      t.text('url'); // accessible URL
      t.string('mime_type', 50);
      t.bigInteger('file_size').defaultTo(0);
      t.integer('width');
      t.integer('height');
      t.float('duration'); // video/audio duration in seconds
      t.jsonb('metadata').defaultTo('{}'); // generation params, model info
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.index('node_id');
      t.index('type');
    });
    console.log('  ✅ media_files 表已创建');
  }

  // groups 表
  if (!(await db.schema.hasTable('groups'))) {
    await db.schema.createTable('groups', (t) => {
      t.uuid('id').primary();
      t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
      t.string('title', 255).defaultTo('');
      t.float('x').defaultTo(0);
      t.float('y').defaultTo(0);
      t.float('width').defaultTo(600);
      t.float('height').defaultTo(400);
      t.string('color', 20).defaultTo('#3b82f6');
      t.specificType('node_ids', 'text[]').defaultTo('{}');
      t.jsonb('data').defaultTo('{}');
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.index('project_id');
    });
    console.log('  ✅ groups 表已创建');
  }

  // characters 表
  if (!(await db.schema.hasTable('characters'))) {
    await db.schema.createTable('characters', (t) => {
      t.uuid('id').primary();
      t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
      t.uuid('node_id').references('id').inTable('nodes').onDelete('SET NULL');
      t.string('name', 255).notNullable();
      t.string('role_type', 20).defaultTo('supporting');
      t.jsonb('profile_data').defaultTo('{}');
      t.text('avatar_url');
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.timestamp('updated_at').defaultTo(db.fn.now());
      t.index('project_id');
    });
    console.log('  ✅ characters 表已创建');
  }

  console.log('✅ 数据库迁移完成');
  await db.destroy();
}

migrate().catch((err) => {
  console.error('❌ 迁移失败:', err);
  process.exit(1);
});
