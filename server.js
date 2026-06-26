const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Jab koi website kholega, toh use index.html dikhegi
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Jab koi dost connect hoga (Live Pipe)
io.on('connection', (socket) => {
    console.log('Ek naya user connect hua! ID:', socket.id);

    // Pen aur Eraser ka live data
    socket.on('drawing', (data) => {
        socket.broadcast.emit('drawing', data);
    });

    // Shapes ka data
    socket.on('drawShape', (data) => {
        socket.broadcast.emit('drawShape', data);
    });

    // Chat Message ka data
    socket.on('chatMessage', (data) => {
        socket.broadcast.emit('chatMessage', data);
    });

    // Text likhne ka data (NAYA)
    socket.on('drawText', (data) => {
        socket.broadcast.emit('drawText', data);
    });

    // Canvas Clear karne ka signal (NAYA)
    socket.on('clearCanvas', () => {
        socket.broadcast.emit('clearCanvas');
    });

    // Jab koi dost website band karega
    socket.on('disconnect', () => {
        console.log('User disconnect ho gaya:', socket.id);
    });
});

// Server ko port 3000 par chalu karein
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});