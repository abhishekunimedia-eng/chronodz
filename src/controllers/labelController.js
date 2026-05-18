const pool = require('../config/db');

const PDFDocument = require('pdfkit');

const fs = require('fs');

const path = require('path');

const {

    generateBarcode,
    generateQRCode

} = require('../services/labelService');


// ======================================
// GENERATE SHIPPING LABEL
// ======================================

exports.generateLabel = async (req, res) => {

    try {

        const { awb_no } = req.params;


        // ======================================
        // GET SHIPMENT
        // ======================================

        const shipmentResult = await pool.query(
            `
            SELECT *
            FROM shipments
            WHERE awb_no = $1
            `,
            [awb_no]
        );

        if (shipmentResult.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: 'Shipment not found'
            });
        }

        const shipment = shipmentResult.rows[0];


        // ======================================
        // GENERATE BARCODE + QR
        // ======================================

        const barcodePath =
            await generateBarcode(awb_no);

        const qrPath =
            await generateQRCode(awb_no);


        // ======================================
        // CREATE PDF
        // ======================================

        const labelPath =
            `src/uploads/labels/${awb_no}-label.pdf`;

        const doc = new PDFDocument({

            size: 'A6',

            margin: 20
        });

        const stream =
            fs.createWriteStream(labelPath);

        doc.pipe(stream);


        // ======================================
        // COMPANY TITLE
        // ======================================

        doc
            .fontSize(18)
            .text(
                'EXPRESS MAIL',
                {
                    align: 'center'
                }
            );

        doc.moveDown();


        // ======================================
        // AWB
        // ======================================

        doc
            .fontSize(12)
            .text(`AWB: ${awb_no}`);


        // ======================================
        // RECEIVER DETAILS
        // ======================================

        doc.moveDown();

        doc.text(
            `Receiver: ${shipment.receiver_name}`
        );

        doc.text(
            `Mobile: ${shipment.receiver_mobile}`
        );

        doc.text(
            `City: ${shipment.receiver_city}`
        );

        doc.text(
            `Address: ${shipment.receiver_address}`
        );


        // ======================================
        // BARCODE
        // ======================================

        doc.moveDown();

        doc.image(
            barcodePath,
            {
                width: 220
            }
        );


        // ======================================
        // QR CODE
        // ======================================

        doc.moveDown();

        doc.image(
            qrPath,
            {
                width: 80
            }
        );


        // ======================================
        // FOOTER
        // ======================================

        doc.moveDown();

        doc.text(
            'Handle With Care',
            {
                align: 'center'
            }
        );


        doc.end();


        stream.on('finish', () => {

            res.download(labelPath);
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};