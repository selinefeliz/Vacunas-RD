const { sanitizeInput } = require('../utils/validation');

/**
 * Global Sanitization Middleware
 * Cleans null bytes, newlines, and path traversal from all inputs.
 */
const globalSanitize = (req, res, next) => {
    const sanitizeObject = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = sanitizeInput(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);

    next();
};

/**
 * UTF-8 Header Middleware
 * Ensures all responses specify UTF-8 charset.
 */
const utf8Middleware = (req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
};

module.exports = {
    globalSanitize,
    utf8Middleware
};
