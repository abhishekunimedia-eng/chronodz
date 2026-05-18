const pool = require('../config/db');
const {
    getIO
} = require('../socket/trackingSocket');

// ======================================
// CREATE COURIER
// ======================================

exports.createCourier = async (req, res) => {

    try {

        const {

            courier_code,
            courier_name,
            mobile,
            email,
            vehicle_no

        } = req.body;


        // Check Existing Courier
        const existingCourier = await pool.query(
            `
            SELECT *
            FROM couriers
            WHERE mobile = $1
            `,
            [mobile]
        );

        if (existingCourier.rows.length > 0) {

            return res.status(400).json({
                success: false,
                message: 'Courier already exists'
            });
        }


        // Insert Courier
        const result = await pool.query(
            `
            INSERT INTO couriers
            (
                courier_code,
                courier_name,
                mobile,
                email,
                vehicle_no
            )
            VALUES
            ($1,$2,$3,$4,$5)

            RETURNING *
            `,
            [
                courier_code,
                courier_name,
                mobile,
                email,
                vehicle_no
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Courier created successfully',
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
// GET ALL COURIERS
// ======================================

exports.getCouriers = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT *
            FROM couriers

            ORDER BY created_at DESC
            `
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
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
// GET COURIER BY ID
// ======================================

exports.getCourierById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT *
            FROM couriers
            WHERE courier_id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: 'Courier not found'
            });
        }

        res.status(200).json({
            success: true,
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
// UPDATE COURIER
// ======================================

exports.updateCourier = async (req, res) => {

    try {

        const { id } = req.params;

        const {

            courier_name,
            mobile,
            email,
            vehicle_no,
            is_available

        } = req.body;


        const result = await pool.query(
            `
            UPDATE couriers
            SET

                courier_name = $1,
                mobile = $2,
                email = $3,
                vehicle_no = $4,
                is_available = $5

            WHERE courier_id = $6

            RETURNING *
            `,
            [
                courier_name,
                mobile,
                email,
                vehicle_no,
                is_available,
                id
            ]
        );

        res.status(200).json({
            success: true,
            message: 'Courier updated successfully',
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
// DELETE COURIER
// ======================================

exports.deleteCourier = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM couriers
            WHERE courier_id = $1

            RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: 'Courier not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Courier deleted successfully'
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
// UPDATE COURIER LOCATION
// ======================================

exports.updateCourierLocation =
async (req, res) => {

    try {

        const {

            latitude,
            longitude

        } = req.body;


        // ======================================
        // FIND COURIER
        // ======================================

        const courierResult =
            await pool.query(
                `
                SELECT *
                FROM couriers
                WHERE user_id = $1
                `,
                [req.user.user_id]
            );


        if (
            courierResult.rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message: 'Courier not found'
            });
        }


        const courier =
            courierResult.rows[0];

        const courier_id =
            courier.courier_id;


        // ======================================
        // UPDATE LOCATION
        // ======================================

        const result = await pool.query(
            `
            UPDATE couriers

            SET

                current_latitude = $1,

                current_longitude = $2

            WHERE courier_id = $3

            RETURNING *
            `,
            [
                latitude,

                longitude,

                courier_id
            ]
        );


        // ======================================
        // SOCKET EVENT
        // ======================================

        const io = getIO();

        io.emit(
            'courierLocationUpdated',
            {

                courier_id,

                courier_name:
                    courier.courier_name,

                latitude,

                longitude
            }
        );


        // ======================================
        // RESPONSE
        // ======================================

        res.status(200).json({

            success: true,

            message:
                'Courier location updated'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: error.message
        });
    }
};

// ======================================
// GET COURIER LOCATIONS
// ======================================

exports.getCourierLocations = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT

                courier_id,

                courier_name,

                vehicle_no,

                current_latitude,

                current_longitude

            FROM couriers

            WHERE current_latitude IS NOT NULL
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
// ======================================
// COURIER DASHBOARD
// ======================================

exports.getCourierDashboard =
async (req, res) => {

    try {

        console.log(
            'Courier dashboard API called'
        );

        res.status(200).json({

            success: true,

            data: {

                assigned_shipments: 2,

                delivered: 0,

                in_transit: 1,

                recent_shipments: [

                    {
                        awb_no:
                            'EMS260514565762',

                        receiver_name:
                            'amit',

                        receiver_city:
                            'Delhi',

                        status_name:
                            'Pickup Assigned'
                    },

                    {
                        awb_no:
                            'EMS260507173304',

                        receiver_name:
                            'Rahul Verma',

                        receiver_city:
                            'Delhi',

                        status_name:
                            'In Transit'
                    }
                ]
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: error.message
        });
    }
};

// ======================================
// ASSIGNED SHIPMENTS
// ======================================

exports.getAssignedShipments = async (req, res) => {

    try {

        // ======================================
        // FIND COURIER
        // ======================================

       const courierResult =
    await pool.query(
        `
        SELECT *
        FROM couriers
        WHERE user_id = $1
        `,
        [req.user.user_id]
    );


        if (courierResult.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: 'Courier not found'
            });
        }


        const courier_id =
            courierResult.rows[0].courier_id;


        // ======================================
        // FETCH SHIPMENTS
        // ======================================

        const result = await pool.query(
            `
            SELECT

                s.shipment_id,

                s.awb_no,

                s.receiver_name,

                s.receiver_mobile,

                s.receiver_address,

                s.receiver_city,

                stm.status_name

            FROM shipment_assignments sa

            LEFT JOIN shipments s
            ON sa.shipment_id = s.shipment_id

            LEFT JOIN shipment_status_master stm
            ON s.current_status_id = stm.status_id

            WHERE sa.courier_id = $1

            ORDER BY sa.assigned_at DESC
            `,
            [courier_id]
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
// UPDATE SHIPMENT STATUS
// ======================================

exports.updateShipmentStatus = async (req, res) => {

    try {

        const {

            shipment_id,
            status_code,
            remarks,
            location

        } = req.body;


        // ======================================
        // FIND STATUS
        // ======================================

        const statusResult = await pool.query(
            `
            SELECT *
            FROM shipment_status_master
            WHERE status_code = $1
            `,
            [status_code]
        );


        if (statusResult.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: 'Invalid Status'
            });
        }


        const status =
            statusResult.rows[0];


        // ======================================
        // UPDATE SHIPMENT
        // ======================================

        await pool.query(
            `
            UPDATE shipments

            SET current_status_id = $1

            WHERE shipment_id = $2
            `,
            [
                status.status_id,
                shipment_id
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
                location
            )
            VALUES ($1,$2,$3,$4)
            `,
            [
                shipment_id,
                status.status_id,
                remarks,
                location
            ]
        );


        // ======================================
        // SOCKET EVENT
        // ======================================

        const io = getIO();

        io.emit(
            'shipmentStatusUpdated',
            {
                shipment_id,
                status_code
            }
        );


        res.status(200).json({

            success: true,

            message:
                'Shipment status updated'
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
// UPLOAD POD
// ======================================

exports.uploadPOD = async (req, res) => {

    try {

        const {

            shipment_id,
            receiver_name,
            remarks

        } = req.body;


        // ======================================
        // FILES
        // ======================================

        const delivery_photo =
            req.files.delivery_photo
                ? req.files.delivery_photo[0].path
                : null;

        const receiver_signature =
            req.files.receiver_signature
                ? req.files.receiver_signature[0].path
                : null;


        // ======================================
        // INSERT POD
        // ======================================

        const result = await pool.query(
            `
            INSERT INTO shipment_pod
            (
                shipment_id,

                receiver_name,

                remarks,

                delivery_photo,

                receiver_signature
            )
            VALUES ($1,$2,$3,$4,$5)

            RETURNING *
            `,
            [
                shipment_id,

                receiver_name,

                remarks,

                delivery_photo,

                receiver_signature
            ]
        );


        res.status(201).json({

            success: true,

            message:
                'POD uploaded successfully',

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