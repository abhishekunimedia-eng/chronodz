let io;


// ======================================
// INITIALIZE SOCKET
// ======================================

const initSocket = (server) => {

    const socketIo = require('socket.io');

    io = socketIo(server, {

        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });


    io.on('connection', (socket) => {

        console.log('Client Connected:', socket.id);


        // ======================================
        // JOIN SHIPMENT ROOM
        // ======================================

        socket.on('joinShipmentRoom', (awb_no) => {

            socket.join(awb_no);

            console.log(`Joined Room: ${awb_no}`);
        });


        // ======================================
        // DISCONNECT
        // ======================================

        socket.on('disconnect', () => {

            console.log('Client Disconnected');
        });
    });

    return io;
};


// ======================================
// GET IO INSTANCE
// ======================================

const getIO = () => {

    if (!io) {
        throw new Error('Socket.io not initialized');
    }

    return io;
};

module.exports = {
    initSocket,
    getIO
};