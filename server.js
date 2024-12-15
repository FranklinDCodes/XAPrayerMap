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

    // Handle user shading a country
    socket.on('shadeCountry', (data) => {
        const { country } = data;

        if (userSelections[socket.id] === country) {
            return; // Prevent double-shading the same country
        }

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

        let opacity = countriesState[country] || 0;
        if (opacity < 100) {
            opacity += 25;
            countriesState[country] = opacity;

            io.emit('updateCountry', { country, opacity });

            userSelections[socket.id] = country;
        }
    });

    // Handle synchronization on reconnect
    socket.on('reconnectSync', (data) => {
        const { country } = data;

        // Get the user's previously selected country
        const previouslySelected = userSelections[socket.id];
        if (previouslySelected && previouslySelected !== country) {
            if (countriesState[previouslySelected] > 0) {
                countriesState[previouslySelected] -= 25;
                io.emit('updateCountry', {
                    country: previouslySelected,
                    opacity: countriesState[previouslySelected],
                });
            }
        }

        // Update the server state for the user's current selection
        userSelections[socket.id] = country;
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected');
        delete userSelections[socket.id];
    });
});


// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server running on port 3000');
});
