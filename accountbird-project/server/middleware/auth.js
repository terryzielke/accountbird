// server/middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Middleware to check for a valid JWT and optionally verify the user's role.
 * @param {string[]} allowedRoles - An array of roles that are allowed to access the route.
 * If not provided, the route is simply protected by a valid token.
 */
module.exports = function (allowedRoles = []) {
    return (req, res, next) => {
        const token = req.header('x-auth-token');

        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded.user;

            if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ msg: 'Access denied: Insufficient privileges' });
            }

            next();
        } catch (err) {
            // Log the error to the console for debugging
            console.error('JWT verification error:', err.message);
            res.status(401).json({ msg: 'Token is not valid' });
        }
    };
};