import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";

// MySQL connection configuration
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Validate required environment variables
if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  throw new Error(
    "DB_USER, DB_PASSWORD, and DB_NAME must be set for MySQL connection",
  );
}

export const connection = mysql.createPool(connectionConfig);
export const db = drizzle(connection, { schema, mode: 'default' });