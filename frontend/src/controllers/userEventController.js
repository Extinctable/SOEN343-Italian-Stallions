let db;

const injectDB = (pgInstance) => {
  db = pgInstance;
};

const getUserEvents = async (req, res) => {
  try {
    // Check for query parameters: event_id takes precedence, then user_id.
    const { event_id, user_id } = req.query;
    let query = "SELECT * FROM user_events";
    let params = [];

    if (event_id) {
      query += " WHERE event_id = $1";
      params.push(event_id);
    } else if (user_id) {
      query += " WHERE user_id = $1";
      params.push(user_id);
    }

    query += " ORDER BY registration_date DESC;";

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to get user events:", err);
    res.status(500).json({ error: "Failed to get user events" });
  }
};

const addUserEvent = async (req, res) => {
  const { user_id, event_id } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO user_events (user_id, event_id)
       VALUES ($1, $2) RETURNING *;`,
      [user_id, event_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to add user event:", err);
    res.status(500).json({ error: "Failed to add user event" });
  }
};

const deleteUserEvent = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM user_events WHERE id = $1;", [id]);
    res.json({ message: "User event registration deleted successfully" });
  } catch (err) {
    console.error("Failed to delete user event:", err);
    res.status(500).json({ error: "Failed to delete user event" });
  }
};

module.exports = {
  injectDB,
  getUserEvents,
  addUserEvent,
  deleteUserEvent,
};
