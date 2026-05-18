const pool = require('../config/db');

const PDFDocument = require('pdfkit');

const fs = require('fs');

const path = require('path');

// ======================================
// GENERATE INVOICE
// ======================================

exports.generateInvoice = async (req, res) => {

    try {

        const {

            customer_id,
            shipment_id,
            freight_charge,
            fuel_charge,
            cod_charge,
            remarks

        } = req.body;


        // ======================================
        // CALCULATIONS
        // ======================================

        const subtotal =

            Number(freight_charge || 0) +

            Number(fuel_charge || 0) +

            Number(cod_charge || 0);


        const gst_percent = 18;

        const gst_amount =
            (subtotal * gst_percent) / 100;

        const total_amount =
            subtotal + gst_amount;


        // ======================================
        // INVOICE NUMBER
        // ======================================

        const invoice_no =
            `INV${Date.now()}`;


        // ======================================
        // INSERT MASTER
        // ======================================

        const invoiceResult =
            await pool.query(
                `
                INSERT INTO invoice_master
                (
                    invoice_no,

                    customer_id,

                    shipment_id,

                    subtotal,

                    gst_percent,

                    gst_amount,

                    total_amount,

                    remarks
                )
                VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8)

                RETURNING *
                `,
                [
                    invoice_no,

                    customer_id,

                    shipment_id,

                    subtotal,

                    gst_percent,

                    gst_amount,

                    total_amount,

                    remarks
                ]
            );


        const invoice =
            invoiceResult.rows[0];


        // ======================================
        // INSERT ITEMS
        // ======================================

        const items = [

            {
                charge_type:
                    'FREIGHT',

                amount:
                    freight_charge
            },

            {
                charge_type:
                    'FUEL',

                amount:
                    fuel_charge
            },

            {
                charge_type:
                    'COD',

                amount:
                    cod_charge
            }
        ];


        for (const item of items) {

            if (Number(item.amount) > 0) {

                await pool.query(
                    `
                    INSERT INTO invoice_items
                    (
                        invoice_id,

                        charge_type,

                        description,

                        amount
                    )
                    VALUES ($1,$2,$3,$4)
                    `,
                    [
                        invoice.invoice_id,

                        item.charge_type,

                        `${item.charge_type} Charge`,

                        item.amount
                    ]
                );
            }
        }


        res.status(201).json({

            success: true,

            message:
                'Invoice generated successfully',

            data: invoice
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: 'Server Error'
        });
    }
};


// ======================================
// GET ALL INVOICES
// ======================================

exports.getInvoices = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT

                im.*,

                c.customer_name,

                s.awb_no

            FROM invoice_master im

            LEFT JOIN customers c
            ON im.customer_id = c.customer_id

            LEFT JOIN shipments s
            ON im.shipment_id = s.shipment_id

            ORDER BY im.created_at DESC
            `
        );


        res.status(200).json({

            success: true,

            data: result.rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: 'Server Error'
        });
    }
};
// ======================================
// DOWNLOAD PDF INVOICE
// ======================================

exports.downloadInvoicePdf = async (req, res) => {

    try {

        const { invoice_id } = req.params;


        // ======================================
        // INVOICE MASTER
        // ======================================

        const invoiceResult =
            await pool.query(
                `
                SELECT

                    im.*,

                    c.customer_name,

                    c.mobile,

                    c.address,

                    s.awb_no

                FROM invoice_master im

                LEFT JOIN customers c
                ON im.customer_id = c.customer_id

                LEFT JOIN shipments s
                ON im.shipment_id = s.shipment_id

                WHERE im.invoice_id = $1
                `,
                [invoice_id]
            );


        if (
            invoiceResult.rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    'Invoice not found'
            });
        }


        const invoice =
            invoiceResult.rows[0];


        // ======================================
        // ITEMS
        // ======================================

        const itemsResult =
            await pool.query(
                `
                SELECT *
                FROM invoice_items
                WHERE invoice_id = $1
                `,
                [invoice_id]
            );


        const items =
            itemsResult.rows;


        // ======================================
        // PDF
        // ======================================

        const doc =
            new PDFDocument({
                margin: 50
            });


        // FILE NAME
        const fileName =
            `${invoice.invoice_no}.pdf`;


        // HEADERS
        res.setHeader(
            'Content-Type',
            'application/pdf'
        );

        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${fileName}`
        );


        // PIPE
        doc.pipe(res);


        // ======================================
        // COMPANY
        // ======================================

        doc
            .fontSize(24)
            .text(
                'CHRONO DZ',
                {
                    align: 'center'
                }
            );

        doc
            .fontSize(12)
            .text(
                'Express Logistics & Courier Services',
                {
                    align: 'center'
                }
            );

        doc.moveDown(2);


        // ======================================
        // INVOICE HEADER
        // ======================================

        doc
            .fontSize(20)
            .text(
                'TAX INVOICE'
            );

        doc.moveDown();


        doc
            .fontSize(12)
            .text(
                `Invoice No: ${invoice.invoice_no}`
            );

        doc.text(
            `Invoice Date: ${
                new Date(
                    invoice.invoice_date
                ).toLocaleDateString()
            }`
        );

        doc.text(
            `AWB No: ${
                invoice.awb_no || '-'
            }`
        );

        doc.moveDown();


        // ======================================
        // CUSTOMER
        // ======================================

        doc
            .fontSize(14)
            .text(
                'Bill To'
            );

        doc
            .fontSize(12)
            .text(
                invoice.customer_name || ''
            );

        doc.text(
            invoice.mobile || ''
        );

        doc.text(
            invoice.address || ''
        );

        doc.moveDown(2);


        // ======================================
        // ITEMS TABLE
        // ======================================

        doc
            .fontSize(14)
            .text(
                'Charges'
            );

        doc.moveDown();


        items.forEach((item) => {

            doc
                .fontSize(12)
                .text(
                    `${item.charge_type} - ₹ ${item.amount}`
                );
        });


        doc.moveDown(2);


        // ======================================
        // TOTALS
        // ======================================

        doc.text(
            `Subtotal: ₹ ${invoice.subtotal}`
        );

        doc.text(
            `GST (${invoice.gst_percent}%): ₹ ${invoice.gst_amount}`
        );

        doc
            .fontSize(16)
            .text(
                `Total Amount: ₹ ${invoice.total_amount}`
            );

        doc.moveDown(2);


        // ======================================
        // FOOTER
        // ======================================

        doc
            .fontSize(10)
            .text(
                'Thank you for choosing CHRONO DZ',
                {
                    align: 'center'
                }
            );


        // END
        doc.end();

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: 'Server Error'
        });
    }
};