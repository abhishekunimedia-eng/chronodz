const bwipjs = require('bwip-js');

const QRCode = require('qrcode');

const fs = require('fs');

const path = require('path');


// ======================================
// GENERATE BARCODE
// ======================================

exports.generateBarcode = async (awb_no) => {

    const barcodePath =
        `src/uploads/labels/${awb_no}-barcode.png`;

    const png = await bwipjs.toBuffer({

        bcid: 'code128',

        text: awb_no,

        scale: 3,

        height: 10,

        includetext: true,

        textxalign: 'center'
    });

    fs.writeFileSync(barcodePath, png);

    return barcodePath;
};


// ======================================
// GENERATE QR CODE
// ======================================

exports.generateQRCode = async (awb_no) => {

    const qrPath =
        `src/uploads/labels/${awb_no}-qr.png`;

    await QRCode.toFile(
        qrPath,
        awb_no
    );

    return qrPath;
};