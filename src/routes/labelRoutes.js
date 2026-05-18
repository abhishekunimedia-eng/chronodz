const express = require('express');

const router = express.Router();

const labelController = require('../controllers/labelController');

const {
    verifyToken
} = require('../middleware/authMiddleware');


// ======================================
// GENERATE LABEL
// ======================================

router.get(
    '/:awb_no',

    verifyToken,

    labelController.generateLabel
);

module.exports = router;