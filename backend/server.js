const express = require('express');
const fs = require('fs'); // File System module
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs

const app = express();
const PORT = 3000; // The port our backend server will run on
const DB_FILE_PATH = path.join(__dirname, 'db.json');

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON request bodies

// Helper function to read data from db.json
const readDb = () => {
    try {
        if (!fs.existsSync(DB_FILE_PATH)) {
            // If db.json doesn't exist, create it with an empty array
            fs.writeFileSync(DB_FILE_PATH, JSON.stringify([]));
            return [];
        }
        const data = fs.readFileSync(DB_FILE_PATH);
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading from database:", error);
        return []; // Return empty array on error or if file is malformed
    }
};

// Helper function to write data to db.json
const writeDb = (data) => {
    try {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2)); // null, 2 for pretty-printing JSON
    } catch (error) {
        console.error("Error writing to database:", error);
    }
};

// API Endpoints (Routes)

// GET /api/events - Retrieve all events
app.get('/api/events', (req, res) => {
    const events = readDb();
    // Optional: Add filtering by date if needed, e.g., using req.query.date
    // For now, returning all events
    res.json(events);
});

// POST /api/events - Create a new event
app.post('/api/events', (req, res) => {
    const events = readDb();
    const newEvent = {
        id: uuidv4(), // Generate a unique ID
        date: req.body.date,
        time: req.body.time,
        description: req.body.description
    };

    if (!newEvent.date || !newEvent.time || !newEvent.description) {
        return res.status(400).json({ message: 'Date, time, and description are required.' });
    }

    events.push(newEvent);
    writeDb(events);
    res.status(201).json(newEvent); // 201 Created status
});

// DELETE /api/events/:id - Delete an event
app.delete('/api/events/:id', (req, res) => {
    let events = readDb();
    const eventId = req.params.id;
    const initialLength = events.length;
    events = events.filter(event => event.id !== eventId);

    if (events.length === initialLength) {
        return res.status(404).json({ message: 'Event not found.' });
    }

    writeDb(events);
    res.status(200).json({ message: 'Event deleted successfully.' });
    // Alternatively, you can send a 204 No Content status:
    // res.status(204).send();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});