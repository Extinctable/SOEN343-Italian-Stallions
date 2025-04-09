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
const session = driver.session();
console.log("Connected to Neo4j!");

// Step 1: Create the server from Express
const server = http.createServer(app);

// Step 2: Create Socket.IO server
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

  socket.on("stream-ice-candidate", (candidate) => {
    console.log("🧊 ICE candidate relayed");
    socket.broadcast.emit("stream-ice-candidate", candidate);
  });

  // ✅ NEW: Relay subtitle from streamer to viewers
  socket.on("subtitle", (text) => {
    console.log("📢 Subtitle relayed to viewers:", text);
    socket.broadcast.emit("subtitle", text);
  });

  /************************************************************
   * (NEW) The streamer can send raw audio chunks to be transcribed
   * 
   * 1) We save the base64 chunk to a .webm file
   * 2) We call the OpenAI Whisper API
   * 3) We broadcast the transcribed text to all viewers
   ************************************************************/
  socket.on("audio_chunk", async (base64Audio) => {
    let tempFile; // <-- Declare it here!
    try {
      const audioBuffer = Buffer.from(base64Audio, "base64");
    tempFile = path.join(__dirname, `temp_${uuidv4()}.webm`);
    fs.writeFileSync(tempFile, audioBuffer);
      // Prepare form data for Whisper
      const formData = new FormData();
      formData.append("file", fs.createReadStream(tempFile), {
        filename: "audio.webm",
        contentType: "audio/webm"
      });
      formData.append("model", "whisper-1");
      formData.append("language", "en"); // optionally force English

      const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
        headers: {
          //Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
      });

      const text = (response.data.text || "").trim();
      console.log("📝 Transcribed text:", text);

      if (text) {
        // broadcast to all except sender
        socket.broadcast.emit("subtitle", text);
      }

      // cleanup
      fs.unlinkSync(tempFile);
    } catch (err) {
      console.error("❌ Transcription error:", err.response?.data || err.message);
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); // 🧹 Always delete the file
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

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

let loginUserID; // changed

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

// to display users 
app.get("/returnUsers", async (req, res) => {
  const session3 = driver.session();
  console.log("Is this good ", loginUserID);
  try {
    const result = await session3.run(`
      MATCH (u:User)
      WHERE u.id <> $loginUserID
        AND NOT EXISTS {
          MATCH (u)-[:SOME_RELATIONSHIP]-(otherUser:User {id: $loginUserID})
        }
      RETURN u.first AS firstName, u.last AS lastName, u.id AS id
    `, { loginUserID });

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

// requests
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
  } finally {}
});

app.post("/acceptFriendRequest", async (req, res) => {
  const session8 = driver.session();
  try {
    await session8.run(`
      MATCH (a:User)-[r:REQUEST]->(b:User{id: $loginUserID})
      DELETE r
      CREATE (a)-[:FRIEND]->(b) 
      CREATE (b)-[:FRIEND]->(a)
    `, { loginUserID });
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
  const { userID } = req.query;
  try {
    const result = await session2.run(`
      MATCH (sender:User)-[r:REQUEST]->(receiver:User {id: $loginUserID})
      RETURN sender.id AS senderID, sender.first AS firstName, sender.last AS lastName
    `, { loginUserID });

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

// message
app.get("/friends", async (req, res) => {
  const session88 = driver.session();
  try {
    const result = await session88.run(`
      MATCH (u:User {id: $loginUserID})-[:FRIEND]->(f:User) 
      RETURN f.id AS id, f.first AS first, f.last AS last, f.email AS email, f.description AS description
    `, { loginUserID });

    if (result.records.length === 0) {
      return res.json({ message: 'No friends' });
    }

    const friends = result.records.map(record => ({
      id: record.get('id'),
      first: record.get('first'),
      last: record.get('last'),
      email: record.get('email'),
      description: record.get('description'),
    }));

    res.json({ friends });
  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    session88.close();
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
server.listen(PORT, () => {
  console.log(`Server + Socket.IO running on http://localhost:${PORT}`);
});

// Create test user on startup
const first = "Adriano";
const last = "zlatan";
const password = "1";
const description = "Defence";
const email = "mercedes177@example.com";
const preference = "";

(async () => {
  await createUserTable();
  await createStreamsTable();
  await addUser(first, last, password, description, email, preference);
})();

// Export for optional reuse
module.exports = { db, checkUserCredentials };
