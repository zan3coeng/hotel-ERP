const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'hotel_erp'}?sslmode=${process.env.DB_SSL || 'disable'}`;

const pool = new Pool({
  connectionString,
  ssl: process.env.DB_SSL === 'require' || process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_URL?.includes('render.com')
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// 保存原始的 query 方法
const originalQuery = pool.query.bind(pool);

// 将 ? 占位符转换为 PostgreSQL 的 $1, $2, ... 格式
function convertPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index++;
    return `$${index}`;
  });
}

// Neon 冷启动时首次连接可能被中断，针对连接类错误重试一次
function isRetryableConnectionError(err) {
  const msg = (err && err.message) || '';
  return msg.includes('Connection terminated') || msg.includes('connection timeout') || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';
}

// 兼容 mysql2 的 query 方法：返回 [rows, fields]
async function query(sql, params = []) {
  const convertedSql = convertPlaceholders(sql);
  try {
    const result = await originalQuery(convertedSql, params);
    return [result.rows, result.fields];
  } catch (err) {
    if (!isRetryableConnectionError(err)) throw err;
    const result = await originalQuery(convertedSql, params);
    return [result.rows, result.fields];
  }
}

// 兼容 mysql2 的 getConnection 方法
async function getConnection() {
  const client = await pool.connect();
  
  return {
    async query(sql, params = []) {
      const convertedSql = convertPlaceholders(sql);
      const result = await client.query(convertedSql, params);
      return [result.rows, result.fields];
    },
    async beginTransaction() {
      await client.query('BEGIN');
    },
    async commit() {
      await client.query('COMMIT');
    },
    async rollback() {
      await client.query('ROLLBACK');
    },
    release() {
      client.release();
    }
  };
}

pool.query = query;
pool.getConnection = getConnection;

module.exports = pool;
