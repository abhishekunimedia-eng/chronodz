require('dotenv').config();

const http = require('http');

const app = require('./app');

const {
    initSocket
} = require('./socket/trackingSocket');


const PORT = process.env.PORT || 5000;


// ======================================
// CREATE HTTP SERVER
// ======================================

const server = http.createServer(app);


// ======================================
// INITIALIZE SOCKET
// ======================================

initSocket(server);


// ======================================
// START SERVER
// ======================================

server.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);
});