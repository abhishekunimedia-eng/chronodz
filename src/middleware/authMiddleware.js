const jwt = require('jsonwebtoken');

exports.verifyToken = (
    req,
    res,
    next
) => {

    try {

        // ======================================
        // GET TOKEN
        // ======================================

        const authHeader =
            req.headers.authorization;

        console.log(authHeader);


        // ======================================
        // CHECK TOKEN
        // ======================================

        if (
            !authHeader ||
            !authHeader.startsWith(
                'Bearer '
            )
        ) {

            return res.status(401).json({

                success: false,

                message: 'Unauthorized'
            });
        }


        // ======================================
        // EXTRACT TOKEN
        // ======================================

        const token =
            authHeader.split(' ')[1];

        console.log(token);


        // ======================================
        // VERIFY TOKEN
        // ======================================

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        console.log(decoded);


        // ======================================
        // SAVE USER
        // ======================================

        req.user = decoded;

        next();

    } catch (error) {

        console.error(error);

        return res.status(401).json({

            success: false,

            message: 'Invalid token'
        });
    }
};

// ==============================
// ROLE CHECK
// ==============================

exports.authorizeRoles = (...roles) => {

    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {

            return res.status(403).json({
                success: false,
                message: 'Access Denied'
            });
        }

        next();
    };
};