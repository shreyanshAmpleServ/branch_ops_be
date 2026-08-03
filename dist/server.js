import app from './app.js';
import { env } from './config/env.js';
import logger from './utils/logger.js';
const server = app.listen(env.PORT, () => {
    logger.info(`Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});
process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down server...');
    logger.error(`${err.name}: ${err.message}\n${err.stack}`);
    server.close(() => {
        process.exit(1);
    });
});
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down server...');
    logger.error(`${err.name}: ${err.message}\n${err.stack}`);
    process.exit(1);
});
