const multer = require('multer');

const path = require('path');


// ======================================
// STORAGE
// ======================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        if (file.fieldname === 'delivery_photo') {

            cb(null, 'src/uploads/pod');

        } else if (file.fieldname === 'receiver_signature') {

            cb(null, 'src/uploads/signatures');

        }
    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});


// ======================================
// FILE FILTER
// ======================================

const fileFilter = (req, file, cb) => {

    const allowedTypes =
        /jpeg|jpg|png/;

    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    );

    const mimetype = allowedTypes.test(
        file.mimetype
    );

    if (extname && mimetype) {

        return cb(null, true);

    } else {

        cb(new Error('Only images allowed'));
    }
};


const upload = multer({
    storage,
    fileFilter
});

module.exports = upload;