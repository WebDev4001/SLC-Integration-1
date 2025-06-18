// Higher-order function to check roles
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            // This case should ideally be caught by verifyToken middleware first
            return res.status(401).json({ message: 'Authentication required. User role not found.' });
        }

        const userRole = req.user.role;

        if (allowedRoles.includes(userRole)) {
            next(); // Role is allowed, proceed to the next middleware/handler
        } else {
            res.status(403).json({ message: 'Forbidden. You do not have the required role.' });
        }
    };
};

module.exports = checkRole;
