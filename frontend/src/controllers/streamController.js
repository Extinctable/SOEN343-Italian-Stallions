// controllers/streamController.js

require('dotenv').config();
const OpenAI = require('openai');

let db;

const injectDB = (pgInstance) => {
  db = pgInstance;
};

const createStream = async (req, res) => {
  const { userId, title, category, scheduled_time, description } = req.body;

  try {
    const insertQuery = `
      INSERT INTO streams (user_id, title, category, scheduled_time, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await db.query(insertQuery, [userId, title, category, scheduled_time, description]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating stream:", err);
    res.status(500).json({ error: 'Failed to create stream' });
  }
};

const getStreams = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        streams.*, 
        users.first AS user_first_name, 
        users.last AS user_last_name
      FROM streams
      JOIN users ON streams.user_id = users.id
      ORDER BY streams.scheduled_time ASC;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error retrieving streams:", error);
    res.status(500).json({ error: "Failed to fetch streams" });
  }
};
const startStream = async (req, res) => {
  const { streamId } = req.body;

  if (!streamId) {
    return res.status(400).json({ error: "Missing streamId" });
  }

  try {
    const updateQuery = `
      UPDATE streams
      SET status = 'live'
      WHERE id = $1
      RETURNING *;
    `;
    const result = await db.query(updateQuery, [streamId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Stream not found" });
    }

    res.json({ message: "Stream started successfully", stream: result.rows[0] });
  } catch (err) {
    console.error("Error starting stream:", err);
    res.status(500).json({ error: "Failed to start stream" });
  }
};

const recommendStream = async (req, res) => {
  const { preference, upcomingStreams } = req.body;

  if (!preference || !Array.isArray(upcomingStreams) || upcomingStreams.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid input' });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const streamList = upcomingStreams.map((stream, i) => {
    return `Stream ${i + 1}:
  Title: ${stream.title}
  Category: ${stream.category}
  Description: ${stream.description}`;
  }).join("\n\n");

  const prompt = `
You are a recommendation assistant.

A user has the following preferences: ${preference}.
Below is a list of upcoming streams:

${streamList}

Please recommend the best matching stream to the user based on their preferences.
Respond in this exact format:
Title: <stream title>
Why: <reason>`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that recommends streams based on user preferences.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const rawResponse = completion.choices[0].message.content;
    res.status(200).json({ recommendation: rawResponse });
  } catch (err) {
    console.error('Error getting stream recommendation from OpenAI:', err);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
};

module.exports = {
  injectDB,
  createStream,
  getStreams,
  recommendStream,
  startStream
};
