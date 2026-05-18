
const { getIO } = require('../socket/trackingSocket');

const pool = require('../config/db');

const { generateAWB } = require('../services/awbService');

// =====================================
// CREATE SHIPMENT
// =====================================

exports.createShipment = async (req, res) => {

try {

    const {

        customer_id,

        sender_name,
        sender_mobile,
        sender_address,

        receiver_name,
        receiver_mobile,
        receiver_address,
        receiver_city,
        receiver_state,
        receiver_pincode,

        service_type_id,

        actual_weight,

        shipping_amount

    } = req.body;


    // Generate AWB
    const awb_no = generateAWB();


    // Get BOOKED status
    const statusResult = await pool.query(
        `
        SELECT status_id
        FROM shipment_status_master
        WHERE status_code = 'BOOKED'
        `
    );

    const bookedStatusId = statusResult.rows[0].status_id;


    // Insert Shipment
    const shipmentResult = await pool.query(
        `
        INSERT INTO shipments
        (
            awb_no,
            customer_id,

            sender_name,
            sender_mobile,
            sender_address,

            receiver_name,
            receiver_mobile,
            receiver_address,
            receiver_city,
            receiver_state,
            receiver_pincode,

            service_type_id,

            actual_weight,

            shipping_amount,

            current_status_id,

            created_by
        )
        VALUES
        (
            $1,$2,$3,$4,$5,
            $6,$7,$8,$9,$10,$11,
            $12,$13,$14,$15,$16
        )
        RETURNING *
        `,
        [
            awb_no,
            customer_id,

            sender_name,
            sender_mobile,
            sender_address,

            receiver_name,
            receiver_mobile,
            receiver_address,
            receiver_city,
            receiver_state,
            receiver_pincode,

            service_type_id,

            actual_weight,

            shipping_amount,

            bookedStatusId,

            req.user.user_id
        ]
    );

    const shipment = shipmentResult.rows[0];


    // Insert Tracking
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
            bookedStatusId,
            'Shipment Booked',
            'Booking Office',
            req.user.user_id
        ]
    );


    res.status(201).json({
        success: true,
        message: 'Shipment booked successfully',
        data: shipment
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
// TRACK SHIPMENT
// ======================================

exports.trackShipment = async (req, res) => {

try {

    const { awb } = req.params;

    // Get Shipment
    const shipmentResult = await pool.query(
        `
        SELECT
            s.*,

            c.customer_name,

            stm.status_name

        FROM shipments s

        LEFT JOIN customers c
        ON s.customer_id = c.customer_id

        LEFT JOIN shipment_status_master stm
        ON s.current_status_id = stm.status_id

        WHERE s.awb_no = $1
        `,
        [awb]
    );

    if (shipmentResult.rows.length === 0) {

        return res.status(404).json({
            success: false,
            message: 'Shipment not found'
        });
    }

    const shipment = shipmentResult.rows[0];



    // Get Tracking History
    const trackingResult = await pool.query(
        `
        SELECT

            st.*,

            stm.status_name

        FROM shipment_tracking st

        LEFT JOIN shipment_status_master stm
        ON st.status_id = stm.status_id

        WHERE st.shipment_id = $1

        ORDER BY st.event_time ASC
        `,
        [shipment.shipment_id]
    );



    res.status(200).json({
        success: true,

        shipment,

        tracking_history: trackingResult.rows
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

        awb_no,
        status_code,
        tracking_remarks,
        location

    } = req.body;


    // Get Shipment
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


    // Get Status
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
            message: 'Invalid status code'
        });
    }

    const status = statusResult.rows[0];


    // Update Shipment Current Status
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


    // Insert Tracking History
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
            tracking_remarks,
            location,
            req.user.user_id
        ]
    );
// ======================================
// REAL-TIME SOCKET EVENT
// ======================================

const io = getIO();

io.to(awb_no).emit('shipmentStatusUpdated', {

awb_no,

status: status.status_name,

tracking_remarks,

location,

event_time: new Date()
});

    res.status(200).json({
        success: true,
        message: 'Shipment status updated'
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
// ASSIGN COURIER TO SHIPMENT
// ======================================

exports.assignCourier = async (req, res) => {

try {

    const {

        awb_no,
        courier_id,
        remarks

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
    // GET COURIER
    // ======================================

    const courierResult = await pool.query(
        `
        SELECT *
        FROM couriers
        WHERE courier_id = $1
        `,
        [courier_id]
    );

    if (courierResult.rows.length === 0) {

        return res.status(404).json({
            success: false,
            message: 'Courier not found'
        });
    }


    // ======================================
    // GET PICKUP_ASSIGNED STATUS
    // ======================================

    const statusResult = await pool.query(
        `
        SELECT *
        FROM shipment_status_master
        WHERE status_code = 'PICKUP_ASSIGNED'
        `
    );

    const status = statusResult.rows[0];


    // ======================================
    // INSERT ASSIGNMENT
    // ======================================

    await pool.query(
        `
        INSERT INTO shipment_assignments
        (
            shipment_id,
            courier_id,
            assigned_by,
            remarks
        )
        VALUES
        ($1,$2,$3,$4)
        `,
        [
            shipment.shipment_id,
            courier_id,
            req.user.user_id,
            remarks
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
            status.status_id,
            shipment.shipment_id
        ]
    );


    // ======================================
    // INSERT TRACKING HISTORY
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
            'Courier assigned for pickup',
            'Dispatch Center',
            req.user.user_id
        ]
    );


    res.status(200).json({
        success: true,
        message: 'Courier assigned successfully'
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
// GET COURIER ASSIGNED SHIPMENTS
// ======================================

exports.getCourierShipments = async (req, res) => {

try {

    const { courier_id } = req.params;

    const result = await pool.query(
        `
        SELECT

            sa.assignment_id,

            s.awb_no,

            s.receiver_name,
            s.receiver_mobile,

            s.receiver_address,

            s.booking_date,

            stm.status_name,

            c.courier_name

        FROM shipment_assignments sa

        LEFT JOIN shipments s
        ON sa.shipment_id = s.shipment_id

        LEFT JOIN couriers c
        ON sa.courier_id = c.courier_id

        LEFT JOIN shipment_status_master stm
        ON s.current_status_id = stm.status_id

        WHERE sa.courier_id = $1

        ORDER BY sa.assigned_at DESC
        `,
        [courier_id]
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

const {

calculateVolumetricWeight,
getChargeableWeight
} = require('../services/pricingService');

// ======================================
// CALCULATE SHIPPING RATE
// ======================================

exports.calculateShippingRate = async (req, res) => {

try {

    const {

        source_city,
        source_state,

        destination_city,
        destination_state,

        service_type_id,

        actual_weight,

        length,
        width,
        height

    } = req.body;
console.log(req.body);
// ======================================
// SOURCE ZONE
// ======================================

    const sourceZoneResult = await pool.query(
        `
        SELECT zone_id
        FROM city_zone_mapping

        WHERE city_name = $1
        AND state_name = $2
        `,
        [
            source_city,
            source_state
        ]
    );

    if (sourceZoneResult.rows.length === 0) {

        return res.status(404).json({
            success: false,
            message: 'Source zone not found'
        });
    }

    const source_zone_id =
        sourceZoneResult.rows[0].zone_id;


    // ======================================
    // DESTINATION ZONE
    // ======================================

    const destinationZoneResult = await pool.query(
        `
        SELECT zone_id
        FROM city_zone_mapping

        WHERE city_name = $1
        AND state_name = $2
        `,
        [
            destination_city,
            destination_state
        ]
    );

    if (destinationZoneResult.rows.length === 0) {

        return res.status(404).json({
            success: false,
            message: 'Destination zone not found'
        });
    }

    const destination_zone_id =
        destinationZoneResult.rows[0].zone_id;


    // ======================================
    // VOLUMETRIC WEIGHT
    // ======================================

    const volumetricWeight =
        calculateVolumetricWeight(
            length,
            width,
            height
        );


    // ======================================
    // CHARGEABLE WEIGHT
    // ======================================

    const chargeableWeight =
        getChargeableWeight(
            actual_weight,
            volumetricWeight
        );


    // ======================================
    // GET RATE
    // ======================================

    const rateResult = await pool.query(
        `
        SELECT *
        FROM rate_master

        WHERE source_zone_id = $1
        AND destination_zone_id = $2

        AND service_type_id = $3

        AND $4 BETWEEN weight_from
        AND weight_to
        `,
        [
            source_zone_id,
            destination_zone_id,

            service_type_id,

            chargeableWeight
        ]
    );

    if (rateResult.rows.length === 0) {

        return res.status(404).json({
            success: false,
            message: 'Rate not found'
        });
    }

    const rate = rateResult.rows[0];


    res.status(200).json({

        success: true,

        actual_weight,

        volumetric_weight:
            volumetricWeight,

        chargeable_weight:
            chargeableWeight,

        shipping_amount:
            rate.rate_amount
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
// GET ALL SHIPMENTS
// ======================================

exports.getAllShipments = async (req, res) => {

try {

    const result = await pool.query(
        `
        SELECT

            s.*,

            stm.status_name

        FROM shipments s

        LEFT JOIN shipment_status_master stm
        ON s.current_status_id = stm.status_id

        ORDER BY s.created_at DESC
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
// GET SERVICE TYPES
// ======================================

exports.getServiceTypes = async (req, res) => {

try {

    const result = await pool.query(
        `
        SELECT *
        FROM service_types

        ORDER BY service_name
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
// GET SHIPMENT DETAILS
// ======================================

exports.getShipmentDetails = async (req, res) => {

try {

    const { awb_no } = req.params;


    // ======================================
    // SHIPMENT DETAILS
    // ======================================

    const shipmentResult = await pool.query(
        `
        SELECT

            s.*,

            stm.status_name,

            c.customer_name

        FROM shipments s

        LEFT JOIN shipment_status_master stm
        ON s.current_status_id = stm.status_id

        LEFT JOIN customers c
        ON s.customer_id = c.customer_id

        WHERE s.awb_no = $1
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
    // TRACKING HISTORY
    // ======================================

    const trackingResult = await pool.query(
        `
        SELECT

            st.*,

            stm.status_name

        FROM shipment_tracking st

        LEFT JOIN shipment_status_master stm
        ON st.status_id = stm.status_id

        WHERE st.shipment_id = $1

        ORDER BY st.event_time DESC
        `,
        [shipment.shipment_id]
    );


    // ======================================
    // POD DETAILS
    // ======================================

    const podResult = await pool.query(
        `
        SELECT *
        FROM pod

        WHERE shipment_id = $1
        `,
        [shipment.shipment_id]
    );


    res.status(200).json({

        success: true,

        shipment,

        tracking:
            trackingResult.rows,

        pod:
            podResult.rows[0] || null
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
// DASHBOARD ANALYTICS
// ======================================

exports.getDashboardAnalytics = async (req, res) => {

try {

    // ======================================
    // TOTAL SHIPMENTS
    // ======================================

    const totalShipments = await pool.query(
        `
        SELECT COUNT(*) AS total
        FROM shipments
        `
    );


    // ======================================
    // DELIVERED
    // ======================================

    const deliveredShipments = await pool.query(
        `
        SELECT COUNT(*) AS total

        FROM shipments s

        LEFT JOIN shipment_status_master stm
        ON s.current_status_id = stm.status_id

        WHERE stm.status_code = 'DELIVERED'
        `
    );


    // ======================================
    // IN TRANSIT
    // ======================================

    const inTransitShipments = await pool.query(
        `
        SELECT COUNT(*) AS total

        FROM shipments s

        LEFT JOIN shipment_status_master stm
        ON s.current_status_id = stm.status_id

        WHERE stm.status_code = 'IN_TRANSIT'
        `
    );


    // ======================================
    // TOTAL REVENUE
    // ======================================

    const totalRevenue = await pool.query(
        `
        SELECT
            COALESCE(
                SUM(shipping_amount),
                0
            ) AS revenue

        FROM shipments
        `
    );


    // ======================================
    // MONTHLY SHIPMENTS
    // ======================================

    const monthlyShipments = await pool.query(
        `
        SELECT

            TO_CHAR(
                booking_date,
                'Mon'
            ) AS month,

            COUNT(*) AS total

        FROM shipments

        GROUP BY month

        ORDER BY MIN(booking_date)
        `
    );


    // ======================================
    // STATUS WISE
    // ======================================

    const statusWise = await pool.query(
        `
        SELECT

            stm.status_name,

            COUNT(*) AS total

        FROM shipments s

        LEFT JOIN shipment_status_master stm
        ON s.current_status_id = stm.status_id

        GROUP BY stm.status_name
        `
    );


    // ======================================
    // RECENT SHIPMENTS
    // ======================================

    const recentShipments = await pool.query(
        `
        SELECT

            awb_no,

            receiver_name,

            shipping_amount,

            created_at

        FROM shipments

        ORDER BY created_at DESC

        LIMIT 5
        `
    );


    res.status(200).json({

        success: true,

        analytics: {

            total_shipments:
                totalShipments.rows[0].total,

            delivered_shipments:
                deliveredShipments.rows[0].total,

            in_transit_shipments:
                inTransitShipments.rows[0].total,

            total_revenue:
                totalRevenue.rows[0].revenue,

            monthly_shipments:
                monthlyShipments.rows,

            status_wise:
                statusWise.rows,

            recent_shipments:
                recentShipments.rows
        }
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
// CUSTOMER DASHBOARD
// ======================================

exports.getCustomerDashboard = async (req, res) => {

try {

    const customer_id =
        req.user.user_id;


    // ======================================
    // TOTAL SHIPMENTS
    // ======================================

    const totalShipments = await pool.query(
        `
        SELECT COUNT(*) AS total

        FROM shipments

        WHERE customer_id = $1
        `,
        [customer_id]
    );


    // ======================================
    // DELIVERED
    // ======================================

    const deliveredShipments = await pool.query(
        `
        SELECT COUNT(*) AS total

        FROM shipments s

        LEFT JOIN shipment_status_master stm
        ON s.current_status_id = stm.status_id

        WHERE s.customer_id = $1

        AND stm.status_code = 'DELIVERED'
        `,
        [customer_id]
    );


    // ======================================
    // IN TRANSIT
    // ======================================

    const inTransitShipments = await pool.query(
        `
        SELECT COUNT(*) AS total

        FROM shipments s

        LEFT JOIN shipment_status_master stm
        ON s.current_status_id = stm.status_id

        WHERE s.customer_id = $1

        AND stm.status_code = 'IN_TRANSIT'
        `,
        [customer_id]
    );


    // ======================================
    // RECENT SHIPMENTS
    // ======================================

    const recentShipments = await pool.query(
        `
        SELECT

            s.awb_no,

            s.receiver_name,

            s.receiver_city,

            s.shipping_amount,

            stm.status_name,

            s.created_at

        FROM shipments s

        LEFT JOIN shipment_status_master stm
        ON s.current_status_id = stm.status_id

        WHERE s.customer_id = $1

        ORDER BY s.created_at DESC

        LIMIT 5
        `,
        [customer_id]
    );


    res.status(200).json({

        success: true,

        analytics: {

            total_shipments:
                totalShipments.rows[0].total,

            delivered_shipments:
                deliveredShipments.rows[0].total,

            in_transit_shipments:
                inTransitShipments.rows[0].total,

            recent_shipments:
                recentShipments.rows
        }
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
// CUSTOMER SHIPMENTS
// ======================================

exports.getCustomerShipments = async (req, res) => {

try {

    const customer_id =
        req.user.user_id;

    const {

        search = '',
        status = '',
        page = 1,
        limit = 10

    } = req.query;


    const offset =
        (page - 1) * limit;


    // ======================================
    // QUERY
    // ======================================

    const result = await pool.query(
        `
        SELECT

            s.shipment_id,

            s.awb_no,

            s.receiver_name,

            s.receiver_city,

            s.shipping_amount,

            s.booking_date,

            stm.status_name

        FROM shipments s

        LEFT JOIN shipment_status_master stm
        ON s.current_status_id = stm.status_id

        WHERE s.customer_id = $1

        AND (
            s.awb_no ILIKE $2
            OR s.receiver_name ILIKE $2
        )

        AND (
            $3 = ''
            OR stm.status_name = $3
        )

        ORDER BY s.created_at DESC

        LIMIT $4
        OFFSET $5
        `,
        [
            customer_id,

            `%${search}%`,

            status,

            limit,

            offset
        ]
    );


    // ======================================
    // TOTAL COUNT
    // ======================================

    const countResult = await pool.query(
        `
        SELECT COUNT(*) AS total

        FROM shipments s

        LEFT JOIN shipment_status_master stm
        ON s.current_status_id = stm.status_id

        WHERE s.customer_id = $1

        AND (
            s.awb_no ILIKE $2
            OR s.receiver_name ILIKE $2
        )

        AND (
            $3 = ''
            OR stm.status_name = $3
        )
        `,
        [
            customer_id,

            `%${search}%`,

            status
        ]
    );


    res.status(200).json({

        success: true,

        data: result.rows,

        pagination: {

            total:
                countResult.rows[0].total,

            page:
                parseInt(page),

            limit:
                parseInt(limit),

            total_pages:
                Math.ceil(
                    countResult.rows[0].total / limit
                )
        }
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
// PUBLIC TRACKING
// ======================================

exports.publicTrackShipment = async (req, res) => {

try {

    const { awb_no } = req.params;


    // ======================================
    // SHIPMENT
    // ======================================

    const shipmentResult = await pool.query(
        `
        SELECT

            s.*,

            stm.status_name

        FROM shipments s

        LEFT JOIN shipment_status_master stm
        ON s.current_status_id = stm.status_id

        WHERE s.awb_no = $1
        `,
        [awb_no]
    );


    if (shipmentResult.rows.length === 0) {

        return res.status(404).json({

            success: false,

            message: 'Shipment not found'
        });
    }


    const shipment =
        shipmentResult.rows[0];


    // ======================================
    // TRACKING
    // ======================================

    const trackingResult = await pool.query(
        `
        SELECT

            st.*,

            stm.status_name

        FROM shipment_tracking st

        LEFT JOIN shipment_status_master stm
        ON st.status_id = stm.status_id

        WHERE st.shipment_id = $1

        ORDER BY st.event_time DESC
        `,
        [shipment.shipment_id]
    );


    // ======================================
    // POD
    // ======================================

    const podResult = await pool.query(
        `
        SELECT *
        FROM shipment_pod
        WHERE shipment_id = $1
        `,
        [shipment.shipment_id]
    );


    res.status(200).json({

        success: true,

        shipment,

        tracking:
            trackingResult.rows,

        pod:
            podResult.rows[0] || null
    });

} catch (error) {

    console.error(error);

    res.status(500).json({

        success: false,

        message: 'Server Error'
    });
}
};