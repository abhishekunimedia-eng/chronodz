const express = require('express');

const router = express.Router();

const manifestController = require('../controllers/manifestController');

const {
    verifyToken
} = require('../middleware/authMiddleware');


// ======================================
// GET ALL MANIFESTS
// ======================================

router.get(
    '/',
    verifyToken,
    manifestController.getManifests
);


// ======================================
// GET MANIFEST BY ID
// ======================================

router.get(
    '/:id',
    verifyToken,
    manifestController.getManifestById
);


// ======================================
// DELETE MANIFEST
// ======================================

router.delete(
    '/:id',
    verifyToken,
    manifestController.deleteManifest
);

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