const express = require('express');
const { Pool } = require('pg');
const app = express();
const cors = require("cors");
const neo4j = require('neo4j-driver');
const userController = require('./controllers/userController'); // changed here
const streamController = require('./controllers/streamController');

// Enable CORS for all routes
app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());

// Database connection configuration
const db = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Project343DB",
  password: "12345",
  port: 5432,
});

// Check if the connection works
db.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("Connection error", err));

// Inject db into controller
userController.injectDB(db); 
streamController.injectDB(db);

// Create User Table
const createUserTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first VARCHAR(50),
      last VARCHAR(50),
      password VARCHAR(255),
      description TEXT,
      email VARCHAR(100) UNIQUE,
      preference VARCHAR(50)  
    );
  `;
  await db.query(createTableQuery);
  console.log("User table created successfully.");
};

const createStreamsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS streams (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      category VARCHAR(50),
      scheduled_time TIMESTAMP NOT NULL,
      description TEXT,
      is_live BOOLEAN DEFAULT false,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;
  await db.query(createTableQuery);
  console.log("Streams table created successfully.");
};


// Neo4j setup
const driver = neo4j.driver(
  'neo4j://localhost:7687',
  neo4j.auth.basic('neo4j', 'message88')
);

console.log("Connected to Neo4j!");

// Add a user
const addUser = async (first, last, password, description, email) => {
  const insertQuery = `
    INSERT INTO users (first, last, password, description, email)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, first, last, description, email;
  `;

  try {
    const result = await db.query(insertQuery, [first, last, password, description, email]);
    const newUser = result.rows[0];
    console.log("User added successfully to SQL:", newUser);
    await addToNeo4j(newUser);
  } catch (err) {
    console.error("Error adding user:", err);
  }
};

// Add user to Neo4j
const addToNeo4j = async ({ id, first, last, description, email }) => {
  const session = driver.session();
  try {
    const cypherQuery = `
      MERGE (u:User {id: $id})
      SET u.first = $first, u.last = $last, u.description = $description, u.email = $email
      RETURN u;
    `;
    const result = await session.run(cypherQuery, { id, first, last, description, email });
    console.log("User added to Neo4j:", result.records[0].get('u'));
  } catch (error) {
    console.error("Error adding user to Neo4j:", error);
  } finally {
    await session.close();
  }
};

// Check user credentials
const checkUserCredentials = async (email, password) => {
  const query = `SELECT * FROM users WHERE email = $1;`;

  try {
    const result = await db.query(query, [email]);

    if (result.rows.length === 0) {
      console.log("No user found with that email.");
      return false;
    }

    const user = result.rows[0];

    if (user.password === password) {
      console.log("User credentials are valid.");
      return true;
    } else {
      console.log("Incorrect password.");
      return false;
    }
  } catch (err) {
    console.error("Error checking user credentials:", err);
    return false;
  }
};

// Routes
app.post('/add-user', async (req, res) => {
  const { first, last, password, description, email } = req.body;
  try {
    await addUser(first, last, password, description, email);
    res.status(201).json({ message: 'User added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding user', error: err.message });
  }
});

app.post('/check-credentials', async (req, res) => {
  const { email, password } = req.body;
  const valid = await checkUserCredentials(email, password);
  if (valid) {
    res.status(200).json({ message: 'User credentials are valid' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Route using controller to get getUser, and update preferences
app.get('/user', userController.getUser);
app.post('/set-preference', userController.setPreference);

app.post('/create-stream', streamController.createStream);
app.get('/streams', streamController.getStreams);
app.post('/recommend-stream', streamController.recommendStream);

// Initialize the server
const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Create test user on startup
const first = "Platini3";
const last = "Danilo";
const password = "1";
const description = "Goats";
const email = "1@example.com";
const preference = "";

(async () => {
  await createUserTable();
  await createStreamsTable();
  await addUser(first, last, password, description, email, preference);
})();

// Export for optional reuse
module.exports = { db, checkUserCredentials };

driver.close();
