const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
// Glitch sets the PORT environment variable automatically
const PORT = process.env.PORT || 3000;

// --- Configuration for Glitch Persistent Storage ---
// Use the .data directory on Glitch, which is persistent and private
const GLITCH_DATA_DIR = path.join(__dirname, '.data');
const DB_FILE_PATH = path.join(GLITCH_DATA_DIR, 'db.json');

// Ensure the .data directory exists when the server starts
try {
    if (!fs.existsSync(GLITCH_DATA_DIR)) {
        fs.mkdirSync(GLITCH_DATA_DIR, { recursive: true });
        console.log(`Data directory created: ${GLITCH_DATA_DIR}`);
    }
} catch (error) {
    console.error(`Error creating data directory ${GLITCH_DATA_DIR}:`, error);
}
// --- End of Glitch Storage Configuration ---

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to read data from db.json
const readDb = () => {
    try {
        if (!fs.existsSync(DB_FILE_PATH)) {
            fs.writeFileSync(DB_FILE_PATH, JSON.stringify([]));
            console.log(`Initialized empty db.json at ${DB_FILE_PATH}`);
            return [];
        }
        const data = fs.readFileSync(DB_FILE_PATH, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error reading from database at ${DB_FILE_PATH}:`, error);
        try {
            console.warn(`Attempting to re-initialize potentially corrupt db.json at ${DB_FILE_PATH}`);
            fs.writeFileSync(DB_FILE_PATH, JSON.stringify([]));
            return [];
        } catch (initError) {
            console.error(`Failed to re-initialize db.json at ${DB_FILE_PATH}:`, initError);
            return [];
        }
    }
};

// Helper function to write data to db.json
const writeDb = (data) => {
    try {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing to database at ${DB_FILE_PATH}:`, error);
    }
};

// --- API Endpoints (Routes) ---
// (These should be the same as in your previous server.js: GET /api/events, POST /api/events, DELETE /api/events/:id)

// GET /api/events - Retrieve all events
app.get('/api/events', (req, res) => {
    const events = readDb();
    res.json(events);
});

// POST /api/events - Create a new event
app.post('/api/events', (req, res) => {
    const events = readDb();
    const { date, time, description } = req.body;

    if (!date || !time || !description) {
        return res.status(400).json({ message: 'Date, time, and description are required.' });
    }

    const newEvent = {
        id: uuidv4(),
        date: date,
        time: time,
        description: description
    };

    events.push(newEvent);
    writeDb(events);
    res.status(201).json(newEvent);
});

// DELETE /api/events/:id - Delete an event by its ID
app.delete('/api/events/:id', (req, res) => {
    let events = readDb();
    const eventIdToDelete = req.params.id;

    const initialLength = events.length;
    events = events.filter(event => event.id !== eventIdToDelete);

    if (events.length === initialLength) {
        return res.status(404).json({ message: 'Event not found.' });
    }

    writeDb(events);
    res.status(200).json({ message: 'Event deleted successfully.' }); 
});

// Basic root route
app.get('/', (req, res) => {
    res.send('Scheduler Backend is running on Glitch!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server is listening on port ${PORT}`);
    console.log(`Database file is expected at: ${DB_FILE_PATH}`);
    const currentEvents = readDb();
    console.log(`Successfully accessed database. Found ${currentEvents.length} initial events.`);
});