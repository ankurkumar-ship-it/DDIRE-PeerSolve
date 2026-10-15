const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname)));

// Track users in each room
const roomUsers = {};

io.on('connection', (socket) => {
    let currentRoom = null;
    let currentUserName = "Guest";

    socket.on('joinRoom', (data) => {
        // Supports both old string format and new { roomId, userName } object
        const roomId = typeof data === 'object' ? data.roomId : data;
        const userName = typeof data === 'object' && data.userName ? data.userName : "Guest";

        // Max 2 users check (optional, keeps your roomFull logic working)
        if (roomUsers[roomId] && roomUsers[roomId].length >= 2) {
            socket.emit('roomFull');
            return;
        }

        currentRoom = roomId;
        currentUserName = userName;
        socket.join(roomId);

        if (!roomUsers[roomId]) {
            roomUsers[roomId] = [];
        }
        roomUsers[roomId].push({ id: socket.id, name: userName });

        // Send updated user list to everyone in the room
        io.to(roomId).emit('roomUsers', roomUsers[roomId]);

        // Notify the other person in the room that someone joined
        socket.to(roomId).emit('userStatus', { user: userName, action: 'joined' });
    });

    socket.on('drawing', (data) => {
        if (currentRoom) socket.to(currentRoom).emit('drawing', data);
    });

    socket.on('drawShape', (data) => {
        if (currentRoom) socket.to(currentRoom).emit('drawShape', data);
    });

    socket.on('drawText', (data) => {
        if (currentRoom) socket.to(currentRoom).emit('drawText', data);
    });

    socket.on('undo', () => {
        if (currentRoom) socket.to(currentRoom).emit('undo');
    });

    socket.on('redo', () => {
        if (currentRoom) socket.to(currentRoom).emit('redo');
    });

    socket.on('clearCanvas', () => {
        if (currentRoom) socket.to(currentRoom).emit('clearCanvas');
    });

    socket.on('chatMessage', (data) => {
        if (currentRoom) socket.to(currentRoom).emit('chatMessage', data);
    });

    socket.on('disconnect', () => {
        if (currentRoom && roomUsers[currentRoom]) {
            roomUsers[currentRoom] = roomUsers[currentRoom].filter(u => u.id !== socket.id);
            
            // Update remaining users list
            io.to(currentRoom).emit('roomUsers', roomUsers[currentRoom]);
            
            // Notify remaining users that this person left
            socket.to(currentRoom).emit('userStatus', { user: currentUserName, action: 'left' });

            if (roomUsers[currentRoom].length === 0) {
                delete roomUsers[currentRoom];
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
