import rateLimit from 'express-rate-limit';
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: {
        status: 'fail',
        message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 300, // Limit each IP to 300 requests per minute
    message: {
        status: 'fail',
        message: 'Rate limit exceeded. Please slow down your requests.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
