const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create the server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// In-memory store to keep track of the shading state for each country
let countriesState = {};

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// Listen for connections from clients
io.on('connection', (socket) => {
    console.log('A user connected');

    // Initialize the client with the current countries' shading states
    socket.emit('init', countriesState);

    // Handle shading a country (increment opacity by 25%)
    socket.on('shadeCountry', (data) => {
        const { country } = data;
        
        // Get the current opacity or default to 0
        let opacity = countriesState[country] || 0;

        // Increment opacity by 25%
        if (opacity < 100) {
            opacity += 25;
        }

        // Update the country state in memory
        countriesState[country] = opacity;

        // Broadcast the updated opacity to all connected clients
        io.emit('updateCountry', { country, opacity });
    });

    // Handle unselecting a country (reset opacity to 0)
    socket.on('unselectCountry', (data) => {
        const { country } = data;

        // Reset the opacity of the country
        countriesState[country] = 0;

        // Broadcast the reset to all clients
        io.emit('updateCountry', { country, opacity: 0 });
    });

    // Handle disconnect event (optional)
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server running on port 3000');
});
