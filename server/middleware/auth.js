// Authentication middleware to protect admin routes
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        // User is authenticated
        return next();
    }

    // User is not authenticated
    return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.'
    });
};

// Middleware to check warehouse access
const requireWarehouseAccess = (req, res, next) => {
    // First require authentication
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    const { role, warehouse_id } = req.session;

    // Super admin can access anything
    if (role === 'super_admin') {
        return next();
    }

    // Get requested warehouse ID from params or body
    const requestedWarehouse = req.params.warehouseId || req.body.warehouse_id;

    // If no warehouse specified in request, proceed (route implementation should handle context)
    if (!requestedWarehouse) {
        return next();
    }

    // Check if user has access to this warehouse
    if (warehouse_id === parseInt(requestedWarehouse)) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission for this warehouse'
    });
};

// Middleware to check super admin access
const requireSuperAdmin = (req, res, next) => {
    // First require authentication
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (req.session.role !== 'super_admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied: Super Admin privileges required'
        });
    }

    return next();
};

module.exports = { requireAuth, requireWarehouseAccess, requireSuperAdmin };
