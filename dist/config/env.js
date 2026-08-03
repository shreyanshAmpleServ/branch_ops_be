import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();
const envSchema = z.object({
    PORT: z.string().default('5000').transform(Number),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url().default('redis://localhost:6379'),
    JWT_ACCESS_SECRET: z.string().min(8),
    JWT_REFRESH_SECRET: z.string().min(8),
    COOKIE_SECRET: z.string().min(8),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
});
const result = envSchema.safeParse(process.env);
if (!result.success) {
    console.error('Invalid environment configuration:', result.error.format());
    process.exit(1);
}
export const env = result.data;
