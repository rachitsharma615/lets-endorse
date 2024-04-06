const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { connect, connection } = require("mongoose");
const cors = require('cors');  // Added CORS middleware

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

require("dotenv").config();

// Connect to MongoDB
connect('mongodb+srv://rachitsharma:rachitsharma18@cluster0.seusci3.mongodb.net/');

const database = connection;

database.on("error", (error) => {
    console.log("Database connection error:", error);
});

database.once("connected", async () => {
    console.log("Database Connected");
});

// Middleware
app.use(express.json());

// CORS configuration
app.use(cors());

// Import routes
const routes = require('./routes/routes')(io);
app.use(routes);

// Set up WebSocket event handlers
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle socket connection errors
    socket.on('connect_error', (error) => {
        console.log('Socket connection error:', error);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    // Handle message events
    socket.on('message', (data) => {
        io.emit('message', data);
    });

    // Handle group chat events
    socket.on('join group', (groupId) => {
        socket.join(groupId);
    });

    socket.on('leave group', (groupId) => {
        socket.leave(groupId);
    });

    socket.on('group message', (data) => {
        io.to(data.groupId).emit('group message', data);
    });
});

server.listen(1400, () => {
    console.log('Server listening on port 1400');
});
