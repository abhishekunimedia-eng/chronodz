const express = require('express');
const router = express.Router();

const hubController =
    require('../controllers/hubController');

const {
    verifyToken
} = require('../middleware/authMiddleware');

router.get(
    '/',
    verifyToken,
    hubController.getHubs
);

module.exports = router;