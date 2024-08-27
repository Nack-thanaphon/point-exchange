import { rateLimit } from 'express-rate-limit';

const exchangeLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 15, // Limit each IP to 15 requests per windowMs
    message: 'Too many requests from this IP, please try again after 1 minute',
    headers: true,
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({
            message: options.message,
        });
    },
    onLimitReached: (req, res, options) => {
        // Block for 1 minute
        req.rateLimit.resetTime = Date.now() + 1 * 60 * 1000;
    },
});

export default exchangeLimiter;