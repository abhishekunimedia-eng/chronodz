const express = require('express');

const router = express.Router();

const customerController = require('../controllers/customerController');

const {
    verifyToken
} = require('../middleware/authMiddleware');


// ======================================
// CREATE CUSTOMER
// ======================================

router.post(
    '/',
    verifyToken,
    customerController.createCustomer
);


// ======================================
// GET ALL CUSTOMERS
// ======================================

router.get(
    '/',
    verifyToken,
    customerController.getCustomers
);


// ======================================
// GET CUSTOMER BY ID
// ======================================

router.get(
    '/:id',
    verifyToken,
    customerController.getCustomerById
);


// ======================================
// UPDATE CUSTOMER
// ======================================

router.put(
    '/:id',
    verifyToken,
    customerController.updateCustomer
);


// ======================================
// DELETE CUSTOMER
// ======================================

router.delete(
    '/:id',
    verifyToken,
    customerController.deleteCustomer
);

module.exports = router;