const pool = require('../config/db');

const {
    generateManifestNo
} = require('../services/manifestService');

const {
    getIO
} = require('../socket/trackingSocket');


// ======================================
// CREATE MANIFEST
// ======================================

exports.createManifest = async (req, res) => {

    try {

        const {

            source_hub_id,
            destination_hub_id,

            vehicle_no,

            driver_name,
            driver_mobile

        } = req.body;


        const manifest_no =
            generateManifestNo();


        const result = await pool.query(
            `
            INSERT INTO manifests
            (
                manifest_no,

                source_hub_id,
                destination_hub_id,

                vehicle_no,

                driver_name,
                driver_mobile,

                created_by
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7)

            RETURNING *
            `,
            [
                manifest_no,

                source_hub_id,
                destination_hub_id,

                vehicle_no,

                driver_name,
                driver_mobile,

                req.user.user_id
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Manifest created successfully',
            data: result.rows[0]
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
// ADD SHIPMENT TO MANIFEST
// ======================================

exports.addShipmentToManifest = async (req, res) => {

    try {

        const {

            manifest_id,
            awb_no

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
        // INSERT INTO MANIFEST
        // ======================================

        await pool.query(
            `
            INSERT INTO manifest_shipments
            (
                manifest_id,
                shipment_id
            )
            VALUES
            ($1,$2)
            `,
            [
                manifest_id,
                shipment.shipment_id
            ]
        );


        // ======================================
        // GET IN_TRANSIT STATUS
        // ======================================

        const statusResult = await pool.query(
            `
            SELECT *
            FROM shipment_status_master
            WHERE status_code = 'IN_TRANSIT'
            `
        );

        const status = statusResult.rows[0];


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
                status.status_id,
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
                status.status_id,
                'Shipment added to manifest',
                'Origin Hub',
                req.user.user_id
            ]
        );


        // ======================================
        // REAL-TIME SOCKET UPDATE
        // ======================================

        const io = getIO();

        io.to(awb_no).emit('shipmentStatusUpdated', {

            awb_no,

            status: status.status_name,

            tracking_remarks: 'Shipment added to manifest',

            location: 'Origin Hub',

            event_time: new Date()
        });


        res.status(200).json({
            success: true,
            message: 'Shipment added to manifest'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};