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

app.get('/manifest.json', (req, res) => res.sendFile(__dirname + '/manifest.json'));
app.get('/sw.js', (req, res) => res.sendFile(__dirname + '/sw.js'));
app.get('/icon.png', (req, res) => res.sendFile(__dirname + '/icon.png'));

io.on('connection', (socket) => {
    console.log('Ek naya user aaya! ID:', socket.id);

    // 🚪 NAYA: Room Join Karne Ka Logic (Max 2 users)
    socket.on('joinRoom', (roomId) => {
        // Check karo ki room mein pehle se kitne log hain
        const room = io.sockets.adapter.rooms.get(roomId);
        const roomSize = room ? room.size : 0;

        if (roomSize >= 2) {
            // Agar 2 log hain, toh 3rd ko roko
            socket.emit('roomFull'); 
        } else {
            // Agar jagah hai, toh room mein entry do
            socket.join(roomId);
            socket.roomId = roomId; // Socket ko uska room number yaad dila do
            console.log(`User ${socket.id} ne room ${roomId} join kiya. (Total: ${roomSize + 1})`);
        }
    });

    // 🔒 Ab 'broadcast' sabko nahi, sirf uske apne "Room" (socket.roomId) mein jayega
    
    socket.on('drawing', (data) => {
        if(socket.roomId) socket.to(socket.roomId).emit('drawing', data);
    });

    socket.on('drawShape', (data) => {
        if(socket.roomId) socket.to(socket.roomId).emit('drawShape', data);
    });

    socket.on('chatMessage', (data) => {
        if(socket.roomId) socket.to(socket.roomId).emit('chatMessage', data);
    });

    socket.on('drawText', (data) => {
        if(socket.roomId) socket.to(socket.roomId).emit('drawText', data);
    });

    socket.on('clearCanvas', () => {
        if(socket.roomId) socket.to(socket.roomId).emit('clearCanvas');
    });
    // Dost ko Undo ka signal bhejna (Sirf uske Room mein)
    socket.on('undo', () => {
      if(socket.roomId) socket.to(socket.roomId).emit('undo');
    });

    // Dost ko Redo ka signal bhejna (Sirf uske Room mein)
    socket.on('redo', () => {
      if(socket.roomId) socket.to(socket.roomId).emit('redo');
    });
    socket.on('disconnect', () => {
        console.log('User disconnect ho gaya:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
