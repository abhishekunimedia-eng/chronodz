const express = require('express');

const router = express.Router();

const podController = require('../controllers/podController');

const {
    verifyToken
} = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');


// ======================================
// UPLOAD POD
// ======================================

router.post(
    '/upload',

    verifyToken,

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

    podController.uploadPOD
);

module.exports = router;