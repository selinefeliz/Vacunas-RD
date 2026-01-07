const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    console.log(`[AUTH MIDDLEWARE] verifyToken called for: ${req.method} ${req.originalUrl}`); // <-- ADD THIS LOG
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(401);
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;
        next();
    } catch (err) {
        console.error('JWT Verification Error:', err);
        return res.sendStatus(403);
    }
};

const checkRole = (requiredRoleIds) => {
    return (req, res, next) => {
        if (!req.user || typeof req.user.id_Rol === 'undefined') {
            return res.status(403).send({ message: 'Forbidden: Role information is missing from token.' });
        }

        const userRoleId = req.user.id_Rol;

        if (!Array.isArray(requiredRoleIds) || requiredRoleIds.some(isNaN)) {
             console.error('Authorization Error: checkRole requires an array of numeric role IDs.');
             return res.status(500).send({ message: 'Server configuration error in role-checking.' });
        }

        if (requiredRoleIds.includes(userRoleId)) {
            next();
        } else {
            res.status(403).send({ 
                message: `Forbidden: You do not have the required permissions to access this resource. Required role IDs: ${requiredRoleIds.join(', ')}`
            });
        }
    };
};

module.exports = { verifyToken, checkRole };
