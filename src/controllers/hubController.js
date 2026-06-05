const pool =
    require('../config/db');

exports.getHubs = async (req, res) => {

    try {

        const result =
            await pool.query(
                `
                SELECT *
                FROM hubs
                ORDER BY hub_name
                `
            );

        res.json({

            success: true,

            data: result.rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: error.message
        });
    }
};