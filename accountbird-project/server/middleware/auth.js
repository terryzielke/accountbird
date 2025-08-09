// server/middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Middleware to check for a valid JWT and optionally verify the user's role.
 * @param {string[]} allowedRoles - An array of roles that are allowed to access the route.
 * If not provided, the route is simply protected by a valid token.
 */
module.exports = function (allowedRoles = []) {
    return (req, res, next) => {
        // Get token from header
        const token = req.header('x-auth-token');

        // Check if no token
        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach the user from the token payload to the request object
            req.user = decoded.user;

            // Check if a role is required and if the user's role is in the allowedRoles array
            if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ msg: 'Access denied: Insufficient privileges' });
            }

            next();
        } catch (err) {
            res.status(401).json({ msg: 'Token is not valid' });
        }
    };
};