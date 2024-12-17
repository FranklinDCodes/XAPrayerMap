
// requires
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');


// Fix
// countries get lighter when max clicked
// previous countries deselect
// change tab title
// 



//  SETTINGS

//  ********************************************************
//  ********************************************************

//  color for shading
// max clicks should match setting in index.html
const MAX_CLICKS = 4;

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

/*countriesState = {
    "AFG": 1,
    "AFG": 1,
    "AFG": 1,
    "AFG": 1,
    "AFG": 1,
    "AFG": 1,
    "AFG": 1,
    "AGO": 1,
    "ALB": 1,
    "ARE": 1,
    "ARG": 1,
    "ARM": 1,
    "ATA": 1,
    "ATF": 1,
    "AUS": 1,
    "AUT": 1,
    "AZE": 1,
    "BDI": 1,
    "BEL": 1,
    "BEN": 1,
    "BFA": 1,
    "BGD": 1,
    "BGR": 1,
    "BHS": 1,
    "BIH": 1,
    "BLR": 1,
    "BLZ": 1,
    "BMU": 1,
    "BOL": 1,
    "BRA": 1,
    "BRN": 1,
    "BTN": 1,
    "BWA": 1,
    "CAF": 1,
    "CAN": 1,
    "CHE": 1,
    "CHL": 1,
    "CHN": 1,
    "CIV": 1,
    "CMR": 1,
    "COD": 1,
    "COG": 1,
    "COL": 1,
    "CRI": 1,
    "CUB": 1,
    "CYP": 1,
    "CZE": 1,
    "DEU": 1,
    "DJI": 1,
    "DNK": 1,
    "DOM": 1,
    "DZA": 1,
    "ECU": 1,
    "EGY": 1,
    "ERI": 1,
    "ESP": 1,
    "EST": 1,
    "ETH": 1,
    "FIN": 1,
    "FJI": 1,
    "FLK": 1,
    "FRA": 1,
    "GAB": 1,
    "GBR": 1,
    "GEO": 1,
    "GHA": 1,
    "GIN": 1,
    "GMB": 1,
    "GNB": 1,
    "GNQ": 1,
    "GRC": 1,
    "GRL": 1,
    "GTM": 1,
    "GUF": 1,
    "GUY": 1,
    "HND": 1,
    "HRV": 1,
    "HTI": 1,
    "HUN": 1,
    "IDN": 1,
    "IND": 1,
    "IRL": 1,
    "IRN": 1,
    "IRQ": 1,
    "ISL": 1,
    "ISR": 1,
    "ITA": 1,
    "JAM": 1,
    "JOR": 1,
    "JPN": 1,
    "KAZ": 1,
    "KEN": 1,
    "KGZ": 1,
    "KHM": 1,
    "KOR": 1,
    "CS-KM": 1,
    "KWT": 1,
    "LAO": 1,
    "LBN": 1,
    "LBR": 1,
    "LBY": 1,
    "LKA": 1,
    "LSO": 1,
    "LTU": 1,
    "LUX": 1,
    "LVA": 1,
    "MAR": 1,
    "MDA": 1,
    "MDG": 1,
    "MEX": 1,
    "MKD": 1,
    "MLI": 1,
    "MLT": 1,
    "MMR": 1,
    "MNE": 1,
    "MNG": 1,
    "MOZ": 1,
    "MRT": 1,
    "MWI": 1,
    "MYS": 1,
    "NAM": 1,
    "NCL": 1,
    "NER": 1,
    "NGA": 1,
    "NIC": 1,
    "NLD": 1,
    "NOR": 1,
    "NPL": 1,
    "NZL": 1,
    "OMN": 1,
    "PAK": 1,
    "PAN": 1,
    "PER": 1,
    "PHL": 1,
    "PNG": 1,
    "POL": 1,
    "PRI": 1,
    "PRK": 1,
    "PRT": 1,
    "PRY": 1,
    "QAT": 1,
    "ROU": 1,
    "RUS": 1,
    "RWA": 1,
    "ESH": 1,
    "SAU": 1,
    "SDN": 1,
    "SSD": 1,
    "SEN": 1,
    "SLB": 1,
    "SLE": 1,
    "SLV": 1,
    "SOM": 1,
    "SRB": 1,
    "SUR": 1,
    "SVK": 1,
    "SVN": 1,
    "SWE": 1,
    "SWZ": 1,
    "SYR": 1,
    "TCD": 1,
    "TGO": 1,
    "THA": 1,
    "TJK": 1,
    "TKM": 1,
    "TLS": 1,
    "TTO": 1,
    "TUN": 1,
    "TUR": 1,
    "TWN": 1,
    "TZA": 1,
    "UGA": 1,
    "UKR": 1,
    "URY": 1,
    "USA": 1,
    "UZB": 1,
    "VEN": 1,
    "VNM": 1,
    "VUT": 1,
    "PSE": 1,
    "YEM": 1,
    "ZAF": 1,
    "ZMB": 1,
    "ZWE": 1
};*/

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


