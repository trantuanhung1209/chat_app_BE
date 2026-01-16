import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

// Tạo pool singleton
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test kết nối
pool.on('connect', () => {
  console.log('Đã kết nối thành công với PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Lỗi kết nối PostgreSQL:', err);
});

// Tạo Prisma Client singleton với adapter
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const connectDB = async () => {
    try {
        await pool.connect();
        console.log('Kết nối đến cơ sở dữ liệu PostgreSQL thành công');
    } catch (error) {
        console.error('Lỗi kết nối đến cơ sở dữ liệu PostgreSQL:', error);
    }
}

export { prisma };
export default pool;
