const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// =========================
// REGISTER
// =========================

exports.register = async (req, res) => {
    try {

        const {
            full_name,
            mobile,
            email,
            password,
            role
        } = req.body;

        // Check Existing User
        const existingUser = await pool.query(
            `SELECT * FROM users
             WHERE email = $1 OR mobile = $2`,
            [email, mobile]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Hash Password
        const saltRounds = 10;

        const password_hash = await bcrypt.hash(password, saltRounds);

        // Insert User
        const result = await pool.query(
            `
            INSERT INTO users
            (
                role,
                full_name,
                mobile,
                email,
                password_hash
            )
            VALUES ($1,$2,$3,$4,$5)
            RETURNING *
            `,
            [
                role,
                full_name,
                mobile,
                email,
                password_hash
            ]
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
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


// =========================
// LOGIN
// =========================

exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        // Check User
        const result = await pool.query(
    `
    SELECT *
    FROM users
    WHERE email = $1
    `,
    [email]
);

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Email'
            });
        }

        const user = result.rows[0];

        // Compare Password
        const isMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Password'
            });
        }

        // Generate JWT
        const token = jwt.sign(

    {

        user_id: user.user_id,

        email: user.email,

        role: user.role
    },

    process.env.JWT_SECRET,

    {
        expiresIn: '1d'
    }
);

        res.status(200).json({
            success: true,
            message: 'Login Successful',
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
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