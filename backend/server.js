const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const port = 8080;

// Serve static files from the 'build' directory
app.use(express.static(path.join(__dirname, '../build')));

// Handle requests to the root URL by serving the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// Create an HTTP server
const server = http.createServer(app);

// Initialize socket.io with a specific path
const io = socketIo(server, {
  path: '/WEBRTC-1'
});

const peers = io.of('/webrtcPeer');
const rooms = new Map();

peers.on('connection', socket => {
  console.log(`User ${socket.id} connected`);

  socket.on('joinRoom', ({ roomID }) => {
    if (!rooms.has(roomID)) {
      rooms.set(roomID, new Set());
    }
    rooms.get(roomID).add(socket.id);
    socket.join(roomID);
    socket.emit('connection-success', { success: socket.id });
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);
    rooms.forEach((sockets, roomID) => {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          rooms.delete(roomID);
        }
      }
    });
  });

  socket.on('offerOrAnswer', data => {
    const { roomID, payload } = data;
    peers.in(roomID).emit('offerOrAnswer', payload);
  });

  socket.on('candidate', data => {
    const { roomID, payload } = data;
    peers.in(roomID).emit('candidate', payload);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
