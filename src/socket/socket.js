import { io } from 'socket.io-client';

const socket = io(
    'https://chronodz.onrender.com'
);

export default socket;