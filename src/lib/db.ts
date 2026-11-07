import mysql from "mysql2/promise";

const globalForDb = global as unknown as { mysqlPool: mysql.Pool | undefined };

export const pool =
  globalForDb.mysqlPool ||
  mysql.createPool({
    host: process.env.DB_HOST || "srv1882.hstgr.io",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "u774473556_fhuser",
    password: process.env.DB_PASSWORD || "FlavorHouse@2026#Db!",
    database: process.env.DB_NAME || "u774473556_fhdb",
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

if (process.env.NODE_ENV !== "production") globalForDb.mysqlPool = pool;

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [rows] = await pool.query(sql, params);
  return rows as T;
}

