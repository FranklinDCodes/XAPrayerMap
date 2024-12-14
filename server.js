const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let countryStates = {};  // Track the shading state for each country
let userSelections = {}; // Track each user's selected country by socket ID

// Serve static files (index.html, etc.)
app.use(express.static('public'));

// Listen for client connections
io.on('connection', (socket) => {
    console.log('a user connected');

    // Send the current shading state to the newly connected user
    socket.emit('init', countryStates);

    // Handle shading a country
    socket.on('shadeCountry', (data) => {
        const { country } = data;

        // If the country is already selected by the user, don't allow re-selection
        if (userSelections[socket.id] === country) return;

        // If the user already has a selected country, unselect it
        if (userSelections[socket.id]) {
            const previousCountry = userSelections[socket.id];
            socket.emit('unselectCountry', { country: previousCountry });
        }

        // Shade the new country
        if (!countryStates[country]) {
            countryStates[country] = { opacity: 0 };
        }

        if (countryStates[country].opacity < 100) {
            countryStates[country].opacity += 25;
        }

        userSelections[socket.id] = country;  // Store the country for this user

        // Broadcast the updated state to all connected clients
        io.emit('updateCountry', {
            country,
            opacity: countryStates[country].opacity,
        });
    });

    // Handle unselecting a country
    socket.on('unselectCountry', (data) => {
        const { country } = data;
        if (countryStates[country]) {
            // Reset opacity to 0% (unclicked)
            countryStates[country].opacity = 0;

            // Broadcast the update to all clients
            io.emit('updateCountry', {
                country,
                opacity: 0,
            });
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log('user disconnected');
        // When the user disconnects, clear their selection from the userSelections object
        delete userSelections[socket.id];
    });
});

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server running on port 3000');
});
