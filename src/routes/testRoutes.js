const express = require('express');

const router = express.Router();

const testController = require('../controllers/testController');

const {
    verifyToken,
    authorizeRoles
} = require('../middleware/authMiddleware');


// ===================================
// PROTECTED ROUTE
// ===================================

router.get(
    '/dashboard',

    verifyToken,

    authorizeRoles('admin'),

    testController.dashboard
);

module.exports = router;