const express = require('express');

const router = express.Router();

const manifestController = require('../controllers/manifestController');

const {
    verifyToken
} = require('../middleware/authMiddleware');


// ======================================
// CREATE MANIFEST
// ======================================

router.post(
    '/',
    verifyToken,
    manifestController.createManifest
);


// ======================================
// ADD SHIPMENT TO MANIFEST
// ======================================

router.post(
    '/add-shipment',
    verifyToken,
    manifestController.addShipmentToManifest
);

module.exports = router;