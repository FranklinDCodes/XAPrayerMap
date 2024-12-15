const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create the server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// In-memory store to track the opacity state of countries and user interactions
let countriesState = {};
let userSelections = {}; // Tracks the country each user last affected

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// When a new user connects
io.on('connection', (socket) => {
    console.log('A user connected');

    // Send the current state to the newly connected user
    socket.emit('init', countriesState);

    // When a user shades a country
    socket.on('shadeCountry', (data) => {
        const { country } = data;

        // If the country is already selected by this user, do nothing
        if (userSelections[socket.id] === country) {
            return;
        }

        // Unselect the previously selected country (if any)
        const previouslySelected = userSelections[socket.id];
        if (previouslySelected) {
            if (countriesState[previouslySelected] > 0) {
                countriesState[previouslySelected] -= 25;
                io.emit('updateCountry', {
                    country: previouslySelected,
                    opacity: countriesState[previouslySelected],
                });
            }
        }

        // Shade the new selected country
        let opacity = countriesState[country] || 0;
        if (opacity < 100) {
            opacity += 25;
            countriesState[country] = opacity;

            // Broadcast the updated opacity to all clients
            io.emit('updateCountry', { country, opacity });

            // Update the user's selection
            userSelections[socket.id] = country;
        }
    });

    // Handle disconnect event
    socket.on('disconnect', () => {
        console.log('User disconnected');
        // Remove user selection on disconnect
        delete userSelections[socket.id];
    });
});

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server running on port 3000');
});
