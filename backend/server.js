const express = require('express');
const fs = require('fs'); // File System module
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs

const app = express();
// Render sets the PORT environment variable. Default to 3000 for local dev.
const PORT = process.env.PORT || 3000; 

// --- Configuration for Render's Persistent Storage ---
// This is the directory on Render's persistent disk where your data will be stored.
// Make sure this matches the Mount Path you set for the disk in Render's UI.
const RENDER_DATA_DIR = '/var/data/scheduler_db'; 
const DB_FILE_PATH = path.join(RENDER_DATA_DIR, 'db.json');

// Ensure the data directory exists when the server starts
try {
    if (!fs.existsSync(RENDER_DATA_DIR)) {
        fs.mkdirSync(RENDER_DATA_DIR, { recursive: true });
        console.log(`Data directory created: ${RENDER_DATA_DIR}`);
    }
} catch (error) {
    console.error(`Error creating data directory ${RENDER_DATA_DIR}:`, error);
    // Depending on your error handling strategy, you might want to exit
    // process.exit(1); 
}
// --- End of Render Storage Configuration ---

// Middleware
app.use(cors()); // Enable CORS for all routes (consider restricting in production)
app.use(express.json()); // To parse JSON request bodies from the frontend

// Helper function to read data from db.json
const readDb = () => {
    try {
        if (!fs.existsSync(DB_FILE_PATH)) {
            // If db.json doesn't exist in the persistent directory, create it with an empty array
            fs.writeFileSync(DB_FILE_PATH, JSON.stringify([]));
            console.log(`Initialized empty db.json at ${DB_FILE_PATH}`);
            return [];
        }
        const data = fs.readFileSync(DB_FILE_PATH, 'utf8'); // Specify encoding
        // Handle cases where the file might be empty or malformed
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error reading from database at ${DB_FILE_PATH}:`, error);
        // If there's a critical error reading (e.g., malformed JSON),
        // you might want to return an empty array or handle it more gracefully.
        // For now, returning empty array to prevent crashes.
        // To be safer, you could try to write a new empty DB if parse fails.
        try {
            console.warn(`Attempting to re-initialize potentially corrupt db.json at ${DB_FILE_PATH}`);
            fs.writeFileSync(DB_FILE_PATH, JSON.stringify([]));
            return [];
        } catch (initError) {
            console.error(`Failed to re-initialize db.json at ${DB_FILE_PATH}:`, initError);
            return []; // Still return empty if re-init fails
        }
    }
};

// Helper function to write data to db.json
const writeDb = (data) => {
    try {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2)); // null, 2 for pretty-printing JSON
    } catch (error) {
        console.error(`Error writing to database at ${DB_FILE_PATH}:`, error);
    }
};

// --- API Endpoints (Routes) ---

// GET /api/events - Retrieve all events
app.get('/api/events', (req, res) => {
    const events = readDb();
    // Optional: Add filtering by date if needed, e.g., using req.query.date
    // if (req.query.date) {
    //     const filteredEvents = events.filter(event => event.date === req.query.date);
    //     return res.json(filteredEvents);
    // }
    res.json(events);
});

// POST /api/events - Create a new event
app.post('/api/events', (req, res) => {
    const events = readDb();
    const { date, time, description } = req.body; // Destructure from request body

    if (!date || !time || !description) {
        return res.status(400).json({ message: 'Date, time, and description are required.' });
    }

    const newEvent = {
        id: uuidv4(), // Generate a unique ID
        date: date,
        time: time,
        description: description
    };

    events.push(newEvent);
    writeDb(events);
    res.status(201).json(newEvent); // 201 Created status, return the created event
});

// DELETE /api/events/:id - Delete an event by its ID
app.delete('/api/events/:id', (req, res) => {
    let events = readDb();
    const eventIdToDelete = req.params.id;
    
    const initialLength = events.length;
    events = events.filter(event => event.id !== eventIdToDelete);

    if (events.length === initialLength) {
        // No event was filtered out, meaning the ID was not found
        return res.status(404).json({ message: 'Event not found.' });
    }

    writeDb(events);
    // Successfully deleted
    res.status(200).json({ message: 'Event deleted successfully.' }); 
    // Or use res.status(204).send(); for "No Content" if you prefer not to send a body
});

// Basic root route to confirm server is running
app.get('/', (req, res) => {
    res.send('Scheduler Backend is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
    console.log(`Database file is expected at: ${DB_FILE_PATH}`);
    
    // Optional: Perform an initial read/write to ensure db.json is created if it doesn't exist
    // and to verify disk access, especially on platforms like Render.
    console.log("Performing initial database access check...");
    const currentEvents = readDb(); // This will create db.json if it doesn't exist
    console.log(`Successfully accessed database. Found ${currentEvents.length} initial events.`);
});