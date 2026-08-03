import { createClient } from 'redis';
import { env } from './env.js';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

export const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 5000),
  },
  disableOfflineQueue: true,
});

redisClient.on('error', (err) => {
  logger.warn('Redis Connection Failure. Using in-memory fallback.', err);
});

redisClient.on('connect', () => {
  logger.info('Successfully connected to Redis database.');
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.warn('Failed to start Redis client. Memory store will be used.', err);
  }
})();

export default redisClient;
