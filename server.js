
// requires
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');


// Fix
// countries get lighter when max clicked
// previous countries deselect


//  SETTINGS

//  ********************************************************
//  ********************************************************

//  color for shading
// max clicks should match setting in index.html
const MAX_CLICKS = 3;

// state file
const STATE_FILE = "state.json";

//  ********************************************************
//  ********************************************************


// Create the server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// In-memory store to track the opacity state of countries and user interactions
let countriesState = {};
let userSelections = {}; // Tracks the country each user last affected

// Load saved state from file
function loadState() {
    if (fs.existsSync(STATE_FILE)) {
        try {
            const savedState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            countriesState = savedState.countriesState || {};
            userSelections = savedState.userSelections || {};
            console.log('State loaded from file.');
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    } else {
        console.log('No state file found. Starting fresh.');
    }
}

// Save current state to file
function saveState() {
    const state = {
        countriesState,
        userSelections,
    };
    fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), (error) => {
        if (error) {
            console.error('Failed to save state:', error);
        } else {
            console.log('State saved successfully.');
        }
    });
}

// Load state on startup
loadState();

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
                countriesState[previouslySelected] -= (100 / MAX_CLICKS);
                io.emit('updateCountry', {
                    country: previouslySelected,
                    opacity: countriesState[previouslySelected],
                });
            }
        }

        let opacity = countriesState[country] || 0;
        if (opacity < 100) {
            opacity += 100 / MAX_CLICKS;
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
                countriesState[previouslySelected] -= 100 / MAX_CLICKS;
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


