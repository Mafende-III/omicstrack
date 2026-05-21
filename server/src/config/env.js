import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  PORT: parseInt(process.env.PORT, 10) || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  // Email — falls back to console logging when SENDGRID_API_KEY is unset (dev)
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  EMAIL_SENDER: process.env.EMAIL_SENDER || 'contact@streamlinexperts.rw',
  EMAIL_SENDER_NAME: process.env.EMAIL_SENDER_NAME || 'Esperance Umumararungu',
  APP_URL: process.env.APP_URL || 'http://localhost:5173',
};

const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
for (const key of required) {
  if (!env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}
