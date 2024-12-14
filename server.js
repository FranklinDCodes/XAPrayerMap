const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create the server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// In-memory store to track the opacity state of countries
let countriesState = {};

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// When a new user connects
io.on('connection', (socket) => {
    console.log('A user connected');

    // Send the current state to the newly connected user
    socket.emit('init', countriesState);

    // When a user shades a country (increases opacity by 25%)
    socket.on('shadeCountry', (data) => {
        const { country } = data;

        // Get the current opacity or default to 0
        let opacity = countriesState[country] || 0;

        // Increment opacity by 25%, but cap it at 100%
        if (opacity < 100) {
            opacity += 25;
        }

        // Update the opacity state
        countriesState[country] = opacity;

        // Broadcast the updated opacity to all clients
        io.emit('updateCountry', { country, opacity });
    });

    // When a user selects a new country, unselect the previous country (decrease opacity by 25%)
    socket.on('unselectCountry', (data) => {
        const { country } = data;
        
        // Reset opacity of previously selected country (decrease by 25%)
        if (countriesState[country] > 0) {
            countriesState[country] -= 25;
        }

        // Broadcast the reset to all clients
        io.emit('updateCountry', { country, opacity: countriesState[country] });
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
