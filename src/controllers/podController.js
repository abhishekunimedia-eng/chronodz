const pool = require('../config/db');


// ======================================
// UPLOAD POD
// ======================================

exports.uploadPOD = async (req, res) => {

    try {

        const {

            awb_no,
            receiver_name,
            remarks,
            latitude,
            longitude

        } = req.body;


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
        // GET DELIVERED STATUS
        // ======================================

        const statusResult = await pool.query(
            `
            SELECT *
            FROM shipment_status_master
            WHERE status_code = 'DELIVERED'
            `
        );

        const deliveredStatus = statusResult.rows[0];


        // ======================================
        // FILES
        // ======================================

        const delivery_photo =
            req.files['delivery_photo']
                ? req.files['delivery_photo'][0].path
                : null;

        const receiver_signature =
            req.files['receiver_signature']
                ? req.files['receiver_signature'][0].path
                : null;


        // ======================================
        // INSERT POD
        // ======================================

        await pool.query(
            `
            INSERT INTO pod
            (
                shipment_id,

                receiver_name,

                receiver_signature,

                delivery_photo,

                remarks,

                latitude,
                longitude,

                created_by
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8)
            `,
            [
                shipment.shipment_id,

                receiver_name,

                receiver_signature,

                delivery_photo,

                remarks,

                latitude,
                longitude,

                req.user.user_id
            ]
        );


        // ======================================
        // UPDATE SHIPMENT STATUS
        // ======================================

        await pool.query(
            `
            UPDATE shipments
            SET current_status_id = $1
            WHERE shipment_id = $2
            `,
            [
                deliveredStatus.status_id,
                shipment.shipment_id
            ]
        );


        // ======================================
        // INSERT TRACKING
        // ======================================

        await pool.query(
            `
            INSERT INTO shipment_tracking
            (
                shipment_id,
                status_id,
                tracking_remarks,
                location,
                created_by
            )
            VALUES
            ($1,$2,$3,$4,$5)
            `,
            [
                shipment.shipment_id,
                deliveredStatus.status_id,
                'Shipment Delivered',
                'Customer Location',
                req.user.user_id
            ]
        );


        res.status(200).json({
            success: true,
            message: 'POD uploaded successfully'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};