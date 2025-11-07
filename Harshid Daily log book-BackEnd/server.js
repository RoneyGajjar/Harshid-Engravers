const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;
const saltRounds = 10; // For password hashing

// Middleware
app.use(cors()); // Allow requests from the browser
app.use(express.json()); // Parse JSON bodies

// --- Database Connection ---
const mongoUrl = 'mongodb+srv://roneygajjar121_db_user:RoneyGajjar3060@cluster0.z7tewrm.mongodb.net/'; // Default local MongoDB URL
const dbName = 'harshid-logbook';
let db;
let entriesCollection;
let usersCollection; // New collection for users

async function connectToDb() {
    try {
        const client = new MongoClient(mongoUrl);
        await client.connect();
        console.log('Connected successfully to MongoDB');
        db = client.db(dbName);
        entriesCollection = db.collection('entries');
        usersCollection = db.collection('users');
        
        // --- Seed Default Admin User (if none exist) ---
        const adminUser = await usersCollection.findOne({ role: 'admin' });
        if (!adminUser) {
            console.log('No admin user found. Creating default admin...');
            const defaultUserId = 'harshidengraver@logbook';
            const defaultPassword = 'harshid@0086';
            
            const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
            
            await usersCollection.insertOne({
                userId: defaultUserId,
                password: hashedPassword,
                role: 'admin',
                createdAt: new Date().toISOString()
            });
            console.log(`Default admin '${defaultUserId}' created successfully.`);
        }
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1); // Exit if DB connection fails
    }
}

// --- API Endpoints ---

// === User Auth Endpoints ===

// POST /api/login
app.post('/api/login', async (req, res) => {
    if (!usersCollection) {
        return res.status(503).json({ error: 'Database not initialized' });
    }
    try {
        const { userId, password } = req.body;
        const user = await usersCollection.findOne({ userId: userId });

        if (!user) {
            return res.status(401).json({ error: 'Invalid User ID or Password' });
        }

        // Compare submitted password with hashed password
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            // Passwords match
            res.status(200).json({ 
                message: 'Login successful', 
                role: user.role,
                userId: user.userId 
            });
        } else {
            // Passwords don't match
            return res.status(401).json({ error: 'Invalid User ID or Password' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// POST /api/register (Public-facing for creating 'user' accounts)
app.post('/api/register', async (req, res) => {
    if (!usersCollection) {
        return res.status(503).json({ error: 'Database not initialized' });
    }
    try {
        const { userId, password } = req.body;

        if (!userId || !password) {
            return res.status(400).json({ error: 'User ID and Password are required.' });
        }

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ userId: userId });
        if (existingUser) {
            return res.status(400).json({ error: 'User ID already exists' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = {
            userId,
            password: hashedPassword,
            role: 'user', // CRITICAL: Force all public registrations to 'user' role
            createdAt: new Date().toISOString()
        };

        const result = await usersCollection.insertOne(newUser);
        const createdUser = { _id: result.insertedId, userId, role: 'user', createdAt: newUser.createdAt };
        
        res.status(201).json(createdUser);
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// GET /api/users (Admin only)
app.get('/api/users', async (req, res) => {
    // TODO: Add auth middleware to secure this
    if (!usersCollection) {
        return res.status(503).json({ error: 'Database not initialized' });
    }
    try {
        // We only want to send back non-sensitive info
        const users = await usersCollection.find({}, {
            projection: { password: 0 } // Exclude passwords from response
        }).toArray();
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/user (Admin only - for creating new users *with roles*)
app.post('/api/user', async (req, res) => {
    // TODO: Add auth middleware to secure this
    if (!usersCollection) {
        return res.status(503).json({ error: 'Database not initialized' });
    }
    try {
        const { userId, password, role } = req.body; // Admin can specify role

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ userId: userId });
        if (existingUser) {
            return res.status(400).json({ error: 'User ID already exists' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = {
            userId,
            password: hashedPassword,
            role, // Role is set from the request
            createdAt: new Date().toISOString()
        };

        const result = await usersCollection.insertOne( newUser);
        const createdUser = { _id: result.insertedId, userId, role, createdAt: newUser.createdAt };
        
        res.status(201).json(createdUser);
    } catch (err) {
        console.error('Error adding user:', err);
        res.status(500).json({ error: 'Failed to add user' });
    }
});

// DELETE /api/user/:id (Admin only)
app.delete('/api/user/:id', async (req, res) => {
    // TODO: Add auth middleware to secure this
    if (!usersCollection) {
        return res.status(503).json({ error: 'Database not initialized' });
    }
    try {
        const { id } = req.params;
        
        // Prevent deleting the last admin
        if (id) {
            const userToDelete = await usersCollection.findOne({ _id: new ObjectId(id) });
            if (userToDelete && userToDelete.role === 'admin') {
                const adminCount = await usersCollection.countDocuments({ role: 'admin' });
                if (adminCount <= 1) {
                    return res.status(400).json({ error: 'Cannot delete the last admin user.' });
                }
            }
        }
        
        const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});


// === Log Entry Endpoints ===

// GET all log entries
app.get('/api/entries', async (req, res) => {
    if (!entriesCollection) {
        return res.status(503).json({ error: 'Database not initialized' });
    }
    try {
        const entries = await entriesCollection.find({}).toArray();
        res.json(entries);
    } catch (err) {
        console.error('Error fetching entries:', err);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

// POST a new log entry
app.post('/api/entry', async (req, res) => {
    if (!entriesCollection) {
        return res.status(503).json({ error: 'Database not initialized' });
    }
    try {
        const entry = req.body;
        // Add server-side timestamps
        entry.createdAt = new Date().toISOString();
        entry.updatedAt = new Date().toISOString();
        
        const result = await entriesCollection.insertOne(entry);
        // Return the full entry object with the new _id
        const newEntry = { _id: result.insertedId, ...entry };
        res.status(201).json(newEntry);
    } catch (err) {
        console.error('Error adding entry:', err);
        res.status(500).json({ error: 'Failed to add entry' });
    }
});

// PUT (Update) an existing log entry
app.put('/api/entry/:id', async (req, res) => {
    if (!entriesCollection) {
        return res.status(503).json({ error: 'Database not initialized' });
    }
    try {
        const { id } = req.params;
        const entryUpdate = req.body;
        
        // Remove _id from update payload if it exists
        delete entryUpdate._id; 
        
        // Add server-side timestamp
        entryUpdate.updatedAt = new Date().toISOString();

        const result = await entriesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: entryUpdate }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        
        // Send back the updated entry
        const updatedEntry = await entriesCollection.findOne({ _id: new ObjectId(id) });
        res.json(updatedEntry);

    } catch (err) {
        console.error('Error updating entry:', err);
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

// DELETE a log entry
app.delete('/api/entry/:id', async (req, res) => {
    if (!entriesCollection) {
        return res.status(503).json({ error: 'Database not initialized' });
    }
    try {
        const { id } = req.params;
        const result = await entriesCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        
        res.status(200).json({ message: 'Entry deleted successfully' });
    } catch (err) {
        console.error('Error deleting entry:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});


// --- Start Server ---
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    // Connect to DB after server starts listening
    connectToDb();
});