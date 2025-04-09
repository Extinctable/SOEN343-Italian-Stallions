/****************************************************************
 *  COMPLETE SERVER.JS – PRESERVING ORIGINAL LINES, 
 *  ONLY ADDING OPENAI TRANSCRIPTION LOGIC
 ****************************************************************/

require("dotenv").config(); // (NEW) Loads .env
const express = require('express');
const { Pool } = require('pg');
const app = express();
const cors = require("cors");
const neo4j = require('neo4j-driver');
const userController = require('./controllers/userController'); // changed here
const streamController = require('./controllers/streamController');
const { Server } = require("socket.io");
const http = require("http");
const axios = require("axios");         // (NEW) for openAI HTTP calls
const FormData = require("form-data");  // (NEW) for multipart form
const fs = require("fs");               // (NEW) for saving chunk
const path = require("path");           // (NEW) path ops
const { v4: uuidv4 } = require("uuid"); // (NEW) unique temp filenames
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

// Inject db into controllers
userController.injectDB(db); 
streamController.injectDB(db);

// =====================================================================
// CREATE TABLES
// =====================================================================

// Updated Create User Table: now includes role and category (instead of preference)
const createUserTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first VARCHAR(50),
      last VARCHAR(50),
      password VARCHAR(255),
      description TEXT,
      email VARCHAR(100) UNIQUE,
      role VARCHAR(50),
      category VARCHAR(50)
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

// =====================================================================
// NEO4J SETUP
// =====================================================================
const driver = neo4j.driver(
  'neo4j://localhost:7687',
  neo4j.auth.basic('neo4j', 'message88')
);
const session = driver.session();
console.log("Connected to Neo4j!");


// =====================================================================
// SOCKET.IO SETUP
// =====================================================================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001", // 🔁 Make sure your React frontend is running on this
    methods: ["GET", "POST"]
  }
});


// Step 3: Handle socket connections

io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  socket.on("viewer-ready", () => {
    console.log("👀 Viewer is ready, notifying streamer...");
    socket.broadcast.emit("viewer-ready");
  });

  socket.on("stream-offer", (offer) => {
    console.log("📤 Stream offer received, broadcasting to viewers...");
    socket.broadcast.emit("stream-offer", offer);
  });

  socket.on("stream-answer", (answer) => {
    console.log("📥 Answer received, sending to streamer...");
    socket.broadcast.emit("stream-answer", answer);
  });

// 🧊 ICE Candidate relaying
socket.on("stream-ice-candidate", (candidate) => {
  console.log("🧊 ICE candidate relayed");
  socket.broadcast.emit("stream-ice-candidate", candidate);
});

// 📢 Subtitle relaying
socket.on("subtitle", (text) => {
  console.log("📢 Subtitle relayed to viewers:", text);
  socket.broadcast.emit("subtitle", text);
});

/************************************************************
 * (NEW) The streamer can send raw audio chunks to be transcribed
 ************************************************************/
socket.on("audio_chunk", async (base64Audio) => {
  let tempFile;
  try {
    const audioBuffer = Buffer.from(base64Audio, "base64");
    tempFile = path.join(__dirname, `temp_${uuidv4()}.webm`);
    fs.writeFileSync(tempFile, audioBuffer);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(tempFile), {
      filename: "audio.webm",
      contentType: "audio/webm"
    });
    formData.append("model", "whisper-1");
    formData.append("language", "en");

    const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
      headers: {
        // Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
    });

    const text = (response.data.text || "").trim();
    console.log("📝 Transcribed text:", text);
    if (text) {
      socket.broadcast.emit("subtitle", text);
    }

    fs.unlinkSync(tempFile);
  } catch (err) {
    console.error("❌ Transcription error:", err.response?.data || err.message);
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
});

// 💬 Messaging system with Neo4j
socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
  const sessionSocket = driver.session();
  try {
    await sessionSocket.run(
      `MATCH (sender:User {id: $senderId}), (receiver:User {id: $receiverId})
       CREATE (sender)-[:MESSAGE {text: $message, timestamp: datetime()}]->(receiver)`,
      { senderId, receiverId, message }
    );
    io.to(receiverId).emit("receiveMessage", { senderId, message });
  } catch (err) {
    console.error("Error saving message:", err);
  } finally {
    await sessionSocket.close();
  }
});


  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// =====================================================================
// USER FUNCTIONS
// =====================================================================

// Updated addUser function: now accepts role and category.
const addUser = async (first, last, password, description, email, role, category) => {

  const insertQuery = `
    INSERT INTO users (first, last, password, description, email, role, category)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, first, last, description, email, role, category;
  `;
  try {
    const result = await db.query(insertQuery, [first, last, password, description, email, role, category]);
    const newUser = result.rows[0];
    console.log("User added successfully to SQL:", newUser);
    await addToNeo4j(newUser);
  } catch (err) {
    console.error("Error adding user:", err);
  }
};
// Add user to Neo4j
const addToNeo4j = async ({ id, first, last, description, email }) => {
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
    // session.close() if needed
  }
};

let loginUserID; // Global variable to store logged-in user ID

// =====================================================================
// ORIGINAL ENDPOINTS (Modified as needed)
// =====================================================================

// Legacy /add-user endpoint for backward compatibility (uses default role and category)
app.post('/add-user', async (req, res) => {
  const { first, last, password, description, email } = req.body;
  try {
    await addUser(first, last, password, description, email, "organizer", "Event organizers");
    res.status(201).json({ message: 'User added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding user', error: err.message });
  }
});

// Legacy endpoint for checking credentials (without role check)
// (You can continue writing this part based on your logic)

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
      loginUserID = user.id;
      console.log("Login: ", loginUserID);
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

app.post('/check-credentials', async (req, res) => {
  const { email, password } = req.body;
  const valid = await checkUserCredentials(email, password);
  if (valid) {
    res.status(200).json({ message: 'User credentials are valid' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});


// =====================================================================
// NEW SIGN UP ENDPOINT (with role and category)
// =====================================================================
app.post('/signup', async (req, res) => {
  const { fullName, email, password, role, category } = req.body;
  
  // Validate required fields
  if (!fullName || !email || !password || !role || !category) {
    return res.status(400).json({ message: "fullName, email, password, role, and category are required" });
  }
  
  // Split fullName into first and last names
  const nameParts = fullName.split(" ");
  const first = nameParts[0];
  const last = nameParts.slice(1).join(" ") || "";
  const description = "";
  
  try {
    await addUser(first, last, password, description, email, role, category);
    res.status(201).json({ message: "User added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error adding user", error: err.message });
  }
});

// =====================================================================
// NEW LOGIN ENDPOINT (requires role verification)
// =====================================================================
app.get('/login', async (req, res) => {
  const { email, password, role } = req.query;
  try {
    // Look up the user by email and role.
    const query = `SELECT * FROM users WHERE email = $1 AND role = $2;`;
    const result = await db.query(query, [email, role]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials or role" });
    }

    const user = result.rows[0];

    // WARNING: For production, use password hashing instead of plain text.
    if (user.password === password) {
      // ✅ Return the full user object
      return res.status(200).json(user);
    } else {
      return res.status(401).json({ message: "Incorrect password" });
    }
  } catch (err) {
    console.error("Error during login:", err);
    return res.status(500).json({ message: "Error during login", error: err.message });
  }
});


// =====================================================================
// OTHER ENDPOINTS (Friend requests, streams, etc.)
// =====================================================================

// Example: Display users endpoint

app.get("/returnUsers", async (req, res) => {
  const session3 = driver.session();
  console.log("Is this good ", loginUserID);
  try {

    const result = await session3.run(
      `MATCH (u:User)
       WHERE u.id <> $loginUserID
         AND NOT EXISTS {
           MATCH (u)-[:SOME_RELATIONSHIP]-(otherUser:User {id: $loginUserID})
         }AND NOT EXISTS {
       MATCH (u)-[:FRIEND]-(otherUser:User {id: $loginUserID})
     }AND NOT EXISTS {
       MATCH (u)-[:REQUEST]->(otherUser:User {id: $loginUserID})
     }
       RETURN u.first AS firstName, u.last AS lastName, u.id AS id
      `, { loginUserID }
    ); 


    const users = result.records.map(record => ({
      id: record.get("id"),
      firstName: record.get("firstName"),
      lastName: record.get("lastName")
    }));

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Server error");
  } finally {
    session3.close();
  }
});


// Friend request endpoints

app.post("/sendFriendRequest", async (req, res) => {
  const { receiverID } = req.body;
  try {
    await session.run(
      `MATCH (a:User {id: $loginUserID}), (b:User {id: $receiverID})
       MERGE (a)-[:REQUEST {sentBy: $loginUserID, waitingFor: $receiverID}]->(b)`,
      { loginUserID, receiverID }
    );
    res.json({ message: "Friend request sent!" });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).send("Server error");

  }

});

app.post("/acceptFriendRequest", async (req, res) => {
  const session8 = driver.session();
  try {

    await session8.run(
      `MATCH (a:User)-[r:REQUEST]->(b:User {id: $loginUserID})
       DELETE r
       CREATE (a)-[:FRIEND]->(b)
       CREATE (b)-[:FRIEND]->(a)`,
      { loginUserID }
    );

    res.json({ message: "Friend request accepted!" });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).send("Server error");
  } finally {
    session8.close();
  }
});

app.get("/getFriendRequests", async (req, res) => {
  const session2 = driver.session();

  try {
    const result = await session2.run(
      `MATCH (sender:User)-[r:REQUEST]->(receiver:User {id: $loginUserID})
       RETURN sender.id AS senderID, sender.first AS firstName, sender.last AS lastName`,
      { loginUserID }
    );

    const requests = result.records.map(record => ({
      senderID: record.get("senderID"),
      firstName: record.get("firstName"),
      lastName: record.get("lastName")
    }));
    res.json(requests);
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    res.status(500).send("Server error");
  } finally {
    session2.close();
  }
});


// Message (friends) endpoint
app.get("/friends", async (req, res) => {
  const session88 = driver.session();
  try {
    const result = await session88.run(
      `MATCH (u:User {id: $loginUserID})-[:FRIEND]->(f:User)
       RETURN f.id AS id, f.first AS first, f.last AS last, f.email AS email, f.description AS description`,
      { loginUserID }
    );


    if (result.records.length === 0) {
      return res.json({ message: 'No friends' });
    }

    const friends = result.records.map(record => ({
      id: record.get('id'),
      first: record.get('first'),
      last: record.get('last'),
      email: record.get('email'),
      description: record.get('description')
    }));

    res.json({ friends });
  } catch (err) {
    console.error("Error fetching friends:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    session88.close();
  }
});


// =====================================================================
// Routes using controllers
// =====================================================================

app.get('/user', userController.getUser);
app.post('/set-preference', userController.setPreference);
app.post('/create-stream', streamController.createStream);
app.get('/streams', streamController.getStreams);
app.post('/recommend-stream', streamController.recommendStream);

// =====================================================================
// SERVER INITIALIZATION (using server.listen so Socket.IO works)
// =====================================================================
const PORT = 5002;
server.listen(PORT, () => {

  console.log(`Server is running on http://localhost:${PORT}`);

});

// Create test user on startup
const first = "Lilian";
const last = "Thuram";
const password = "1";
const description = "New1";
const email = "merced5555533555Test@example.com";
const preference = "";

(async () => {
  await createUserTable();
  await createStreamsTable();
  try {
    await addUser(first, last, password, description, email, "organizer", "Event organizers");
  } catch (err) {
    console.error("Test user insertion error (likely duplicate):", err.message);
  }
})();

// Export for optional reuse
module.exports = { db, checkUserCredentials };

