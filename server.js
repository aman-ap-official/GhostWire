const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Explicitly serve crypto.js and the frontend folder
app.get('/crypto.js', (req, res) => res.sendFile(path.join(__dirname, 'crypto.js')));
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join-room', (roomId) => {
        console.log(`User ${socket.id} joining room: ${roomId}`);
        socket.join(roomId);
        // Notify others in the room
        socket.to(roomId).emit('user-connected', socket.id);
        
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            socket.to(roomId).emit('user-disconnected', socket.id);
        });
    });

    // Handle call initiation notification
    socket.on('call-initiated', (data) => {
        // Broadcast to everyone in the room except the caller
        socket.to(data.roomId).emit('call-incoming', data);
    });

    socket.on('call-ended', (data) => {
        socket.to(data.roomId).emit('call-ended', data);
    });

    socket.on('signal', (data) => {
        // Forward WebRTC signals (offer, answer, candidates) to the specific peer
        io.to(data.to).emit('signal', {
            from: socket.id,
            signal: data.signal
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`GhostWire Signaling Server running on http://localhost:${PORT}`);
});