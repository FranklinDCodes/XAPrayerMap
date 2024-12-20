
// requires
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');


//  SETTINGS

//  ********************************************************
//  ********************************************************

//  color for shading
// max clicks should match setting in index.html
const MAX_CLICKS = 3;

// state file
const STATE_FILE = "state.json";

// interval in seconds of how frequent to save
const SAVE_INTERVAL = 10;

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
            if (! (e instanceof SyntaxError)) {
                console.error('Failed to load state:', error);
            }
        }
    } else {
        console.log('No state file found. Starting fresh.');
    }
}

// save shaded countries to file
function saveState() {
    const data = JSON.stringify({ countriesState, userSelections }, null, 2);
    fs.writeFileSync(STATE_FILE, data);
}

// Load state on startup
loadState();

// Periodically save state
setInterval(saveState, SAVE_INTERVAL);

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// When a new user connects
io.on('connection', (socket) => {
    //console.log('A user connected');

    // Send the current state to the newly connected user
    socket.emit('init', countriesState);

    // Handle user shading a country
    socket.on('shadeCountry', (data) => {
        const { country } = data;

        // before anything check if country is full
        let opacity = countriesState[country] || 0;
        if (opacity < 100) {

            const previouslySelected = userSelections[socket.id];

            // prevent previous selection deselection for --SML and --CYN
            // need to protect a somolia counterpart
            let somaliaBool = (previouslySelected == "SOM" && country == "--SML") 
                        || (previouslySelected == "--SML" && country == "SOM");

            // need to protect a cyprus counterpart
            let cyprusBool = (previouslySelected == "CYP" && country == "--CYN") 
                        || (previouslySelected == "--CYN" && country == "CYP");

            if (previouslySelected === country || somaliaBool || cyprusBool) {
                return; // Prevent double-shading the same country
            }

            // if previous selection and it's not a counterpart to a linked country
            if (previouslySelected) {
                if (countriesState[previouslySelected] > 0) {
                    countriesState[previouslySelected] -= (100 / MAX_CLICKS);
                    io.emit('updateCountry', {
                        country: previouslySelected,
                        opacity: countriesState[previouslySelected],
                    });

                    // shade counterpart for cyprus and somolia discrepency
                    switch (previouslySelected) {

                        // somolia
                        case "SOM":
                            countriesState["--SML"] -= (100 / MAX_CLICKS);
                            io.emit('updateCountry', {
                                country: "--SML",
                                opacity: countriesState["--SML"],
                            });
                            break;
                        case "--SML":
                            countriesState["SOM"] -= (100 / MAX_CLICKS);
                            io.emit('updateCountry', {
                                country: "SOM",
                                opacity: countriesState["SOM"],
                            });
                            break;

                        // cyprus
                        case "CYP":
                            countriesState["--CYN"] -= (100 / MAX_CLICKS);
                            io.emit('updateCountry', {
                                country: "--CYN",
                                opacity: countriesState["--CYN"],
                            });
                            break;
                        case "--CYN":
                            countriesState["CYP"] -= (100 / MAX_CLICKS);
                            io.emit('updateCountry', {
                                country: "CYP",
                                opacity: countriesState["CYP"],
                            });
                            break;

                    }
                }
            }

            // whether there is a second country to shade for somalia or cyprus
            let secondData = null
            switch (country) {

                case "SOM":
                    secondData = { country: '--SML' };
                    break;
                case "--SML":
                    secondData = { country: 'SOM' };
                    break;
                case "CYP":
                    secondData = { country: '--CYN' };
                    break;
                case "--CYN":
                    secondData = { country: 'CYP' };
                    break;
            }

            // do the actual shading
            opacity += 100 / MAX_CLICKS;
            countriesState[country] = opacity;
            io.emit('updateCountry', { country, opacity });
            userSelections[socket.id] = country;
                
            // shade counterpart if needed
            if (secondData !== null) {

                const { country } = secondData;
                countriesState[country] = opacity;
                io.emit('updateCountry', { country, opacity });

            }
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
        //console.log('User disconnected');
        delete userSelections[socket.id];
    });
});

// Save state before shutting down
process.on('SIGINT', () => {
    console.log('Server shutting down...');
    saveState();
    process.exit();
});

// Save state before shutting down
process.on('SIGTERM', () => {
    console.log('Server shutting down...');
    saveState(); // Save the state to file
    process.exit(); // Exit the process
});

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server running on port 3000');
});


