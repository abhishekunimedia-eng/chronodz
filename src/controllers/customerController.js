const pool = require('../config/db');


// ======================================
// CREATE CUSTOMER
// ======================================

exports.createCustomer = async (req, res) => {

    try {

        const {

            customer_code,
            customer_name,
            mobile,
            email,
            address,
            city,
            state,
            pincode,
            gst_no

        } = req.body;


        // Check Existing Customer
        const existingCustomer = await pool.query(
            `
            SELECT *
            FROM customers
            WHERE mobile = $1
            `,
            [mobile]
        );

        if (existingCustomer.rows.length > 0) {

            return res.status(400).json({
                success: false,
                message: 'Customer already exists'
            });
        }


        // Insert Customer
        const result = await pool.query(
            `
            INSERT INTO customers
            (
                customer_code,
                customer_name,
                mobile,
                email,
                address,
                city,
                state,
                pincode,
                gst_no
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9)

            RETURNING *
            `,
            [
                customer_code,
                customer_name,
                mobile,
                email,
                address,
                city,
                state,
                pincode,
                gst_no
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
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
// GET ALL CUSTOMERS
// ======================================

exports.getCustomers = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT *
            FROM customers

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
// GET CUSTOMER BY ID
// ======================================

exports.getCustomerById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT *
            FROM customers
            WHERE customer_id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: 'Customer not found'
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
// UPDATE CUSTOMER
// ======================================

exports.updateCustomer = async (req, res) => {

    try {

        const { id } = req.params;

        const {

            customer_name,
            mobile,
            email,
            address,
            city,
            state,
            pincode,
            gst_no

        } = req.body;


        const result = await pool.query(
            `
            UPDATE customers
            SET

                customer_name = $1,
                mobile = $2,
                email = $3,
                address = $4,
                city = $5,
                state = $6,
                pincode = $7,
                gst_no = $8

            WHERE customer_id = $9

            RETURNING *
            `,
            [
                customer_name,
                mobile,
                email,
                address,
                city,
                state,
                pincode,
                gst_no,
                id
            ]
        );

        res.status(200).json({
            success: true,
            message: 'Customer updated successfully',
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
// DELETE CUSTOMER
// ======================================

exports.deleteCustomer = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM customers
            WHERE customer_id = $1
            RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Customer deleted successfully'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};