const express = require('express');

const router = express.Router();

const shipmentController = require('../controllers/shipmentController');

const {
    verifyToken
} = require('../middleware/authMiddleware');

const {

    authorizeRoles

} = require(
    '../middleware/roleMiddleware'
);
// ======================================
// CREATE SHIPMENT
// ======================================

router.post(
    '/',
    verifyToken,
    shipmentController.createShipment
);

// ======================================
// PUBLIC TRACKING
// ======================================

router.get(
    '/public-track/:awb_no',

    shipmentController.publicTrackShipment
);
// ======================================
// TRACK SHIPMENT
// ======================================

router.get(
    '/track/:awb',
    shipmentController.trackShipment
);


// ======================================
// UPDATE STATUS
// ======================================

router.post(
    '/update-status',
    verifyToken,
    shipmentController.updateShipmentStatus
);

// ======================================
// ASSIGN COURIER
// ======================================

router.post(
    '/assign-courier',
    verifyToken,
    shipmentController.assignCourier
);


// ======================================
// GET COURIER SHIPMENTS
// ======================================

router.get(
    '/courier/:courier_id',
    verifyToken,
    shipmentController.getCourierShipments
);

// ======================================
// RATE CALCULATOR
// ======================================

router.post(
    '/calculate-rate',

    verifyToken,

    shipmentController.calculateShippingRate
);

// ======================================
// GET ALL SHIPMENTS
// ======================================

router.get(
    '/all',

    verifyToken,

    shipmentController.getAllShipments
);
// ======================================
// GET SERVICE TYPES
// ======================================

router.get(
    '/service-types',

    verifyToken,

    shipmentController.getServiceTypes
);

// ======================================
// SHIPMENT DETAILS
// ======================================

router.get(
    '/details/:awb_no',

    verifyToken,

    shipmentController.getShipmentDetails
);

// ======================================
// DASHBOARD ANALYTICS
// ======================================

router.get(
    '/dashboard-analytics',

    verifyToken,

    shipmentController.getDashboardAnalytics
);

router.post(
    '/',

    verifyToken,

    authorizeRoles('ADMIN'),

    shipmentController.createShipment
);

// ======================================
// CUSTOMER DASHBOARD
// ======================================

router.get(
    '/customer-dashboard',

    verifyToken,

    authorizeRoles('CUSTOMER'),

    shipmentController.getCustomerDashboard
);

// ======================================
// CUSTOMER SHIPMENTS
// ======================================

router.get(
    '/customer-shipments',

    verifyToken,

    authorizeRoles('CUSTOMER'),

    shipmentController.getCustomerShipments
);
module.exports = router;