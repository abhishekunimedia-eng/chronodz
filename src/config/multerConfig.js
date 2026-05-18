const multer = require('multer');

const path = require('path');


// ======================================
// STORAGE
// ======================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(
            null,
            'src/uploads/pod'
        );
    },

    filename: (req, file, cb) => {

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

    const allowedTypes = [

        'image/jpeg',
        'image/png',
        'image/jpg'
    ];

    if (
        allowedTypes.includes(file.mimetype)
    ) {

        cb(null, true);

    } else {

        cb(
            new Error('Invalid file type'),
            false
        );
    }
};


const upload = multer({

    storage,
    fileFilter
});

module.exports = upload;