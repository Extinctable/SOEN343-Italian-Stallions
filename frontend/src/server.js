const express = require('express');
const { Pool } = require('pg');
const app = express();
const cors = require("cors");
const neo4j = require('neo4j-driver');

// Enable CORS for all routes
app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());

// Database connection configuration
const db = new Pool({
  user: "postgres",         // Your PostgreSQL username
  host: "localhost",        // Database host
  database: "Project343DB", // Your database name
  password: "mac1",         // Your PostgreSQL password
  port: 5432,               // Default PostgreSQL port
});

// Check if the connection works
db.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("Connection error", err));

// Create User Table
const createUserTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,   -- Auto-incrementing ID
      first VARCHAR(50),       -- First name
      last VARCHAR(50),        -- Last name
      password VARCHAR(255),   -- Password (hashed ideally)
      description TEXT,        -- Description or bio of the user
      email VARCHAR(100) UNIQUE -- Email (must be unique)
    );
  `;
  await db.query(createTableQuery);
  console.log("User table created successfully.");
};




const driver = neo4j.driver(
    'neo4j://localhost:7687', // Change if using a remote database
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
//neo4j adding user
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
  const query = `
    SELECT * FROM users WHERE email = $1;
  `;

  try {
    const result = await db.query(query, [email]);

    if (result.rows.length === 0) {
      console.log("No user found with that email.");
      return false;
    }

    const user = result.rows[0];

    if (user.password === password) {
      console.log("User credentials are valid.");
      return true; // Password matches
    } else {
      console.log("Incorrect password.");
      return false; // Password doesn't match
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

// Initialize the server
const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


//
const first = "Platini";
const last = "Danilo";
const password = "1"; // Ideally, hash the password before storing it
const description = "Goats";
const email = "121233331288@example.com";

// Create the user table when the server starts
createUserTable();
addUser( first, last, password, description, email);

// Export the database connection and functions
module.exports = { db, checkUserCredentials };


driver.close();