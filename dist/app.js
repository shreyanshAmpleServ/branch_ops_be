import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
// Route imports
import routes from './routes/index.js';
const app = express();
// Parse comma-separated CORS origins (supports multiple dev ports)
const corsOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
app.use(helmet());
app.use(cors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser(env.COOKIE_SECRET));
app.use('/uploads', express.static('uploads'));
// Global API Rate Limiter
app.use('/api', apiLimiter);
// Route bindings
app.use('/api', routes);
// Centralized error handler
app.use(errorHandler);
export default app;
