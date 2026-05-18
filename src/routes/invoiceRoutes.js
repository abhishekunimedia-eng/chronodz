const express = require('express');

const router = express.Router();

const invoiceController =
    require('../controllers/invoiceController');

const {
    verifyToken
} = require('../middleware/authMiddleware');


// ======================================
// GENERATE INVOICE
// ======================================

router.post(
    '/',

    verifyToken,

    invoiceController.generateInvoice
);


// ======================================
// GET ALL INVOICES
// ======================================

router.get(
    '/',

    invoiceController.getInvoices
);

// ======================================
// DOWNLOAD PDF
// ======================================

router.get(
    '/pdf/:invoice_id',

    invoiceController.downloadInvoicePdf
);


module.exports = router;