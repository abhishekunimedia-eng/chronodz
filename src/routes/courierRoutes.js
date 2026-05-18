const express = require('express');

const router = express.Router();

const courierController =
    require('../controllers/courierController');

const {
    verifyToken
} = require('../middleware/authMiddleware');

const {
    authorizeRoles
} = require('../middleware/roleMiddleware');

const upload =
    require('../config/multerConfig');
// ======================================
// CREATE COURIER
// ======================================

router.post(
    '/',
    verifyToken,
    courierController.createCourier
);


// ======================================
// GET ALL COURIERS
// ======================================

router.get(
    '/',
    verifyToken,
    courierController.getCouriers
);


// ======================================
// UPDATE LOCATION
// ======================================

router.post(
    '/update-location',

    verifyToken,

    courierController.updateCourierLocation
);


// ======================================
// GET LIVE LOCATIONS
// ======================================

router.get(
    '/live-locations',

    verifyToken,

    courierController.getCourierLocations
);


// ======================================
// COURIER DASHBOARD
// ======================================

router.get(
    '/dashboard',

    verifyToken,

    authorizeRoles('COURIER'),

    courierController.getCourierDashboard
);

// ======================================
// ASSIGNED SHIPMENTS
// ======================================

router.get(
    '/assigned-shipments',

    verifyToken,

    authorizeRoles('COURIER'),

    courierController.getAssignedShipments
);


// ======================================
// UPDATE STATUS
// ======================================

router.post(
    '/update-shipment-status',

    verifyToken,

    authorizeRoles('COURIER'),

    courierController.updateShipmentStatus
);

// ======================================
// UPLOAD POD
// ======================================

router.post(
    '/upload-pod',

    verifyToken,

    authorizeRoles('COURIER'),

    upload.fields([
        {
            name: 'delivery_photo',
            maxCount: 1
        },
        {
            name: 'receiver_signature',
            maxCount: 1
        }
    ]),

    courierController.uploadPOD
);
// ======================================
// GET COURIER BY ID
// ======================================

router.get(
    '/:id',

    verifyToken,

    courierController.getCourierById
);


// ======================================
// UPDATE COURIER
// ======================================

router.put(
    '/:id',

    verifyToken,

    courierController.updateCourier
);


// ======================================
// DELETE COURIER
// ======================================

router.delete(
    '/:id',

    verifyToken,

    courierController.deleteCourier
);

module.exports = router;