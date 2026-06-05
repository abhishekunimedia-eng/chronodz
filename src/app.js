const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const customerRoutes = require('./routes/customerRoutes');
const courierRoutes = require('./routes/courierRoutes');
const podRoutes = require('./routes/podRoutes');
const labelRoutes = require('./routes/labelRoutes');
const manifestRoutes = require('./routes/manifestRoutes');
const invoiceRoutes =  require('./routes/invoiceRoutes');
const hubRoutes = require('./routes/hubRoutes');

const app = express();


// ===================================
// MIDDLEWARE
// ===================================

app.use(cors());

app.use(express.json());

app.use(
    '/uploads',

    express.static(
        path.join(__dirname, 'uploads')
    )
);

// ===================================
// ROUTES
// ===================================

app.use('/uploads', express.static('src/uploads'));

app.use('/api/auth', authRoutes);

app.use('/api/test', testRoutes);

app.use('/api/shipments', shipmentRoutes);

app.use('/api/customers', customerRoutes);

app.use('/api/couriers', courierRoutes);

app.use('/api/pod', podRoutes);

app.use('/api/labels', labelRoutes);

app.use('/api/manifests', manifestRoutes);

app.use('/api/invoices', invoiceRoutes);

app.use(
    '/api/hubs',
    hubRoutes
);





// ===================================
// TEST ROUTE
// ===================================

app.get('/', (req, res) => {
    res.send('CHRONO DZ API Running');
});

module.exports = app;