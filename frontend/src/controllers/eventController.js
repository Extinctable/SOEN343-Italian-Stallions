let db;

const injectDB = (pgInstance) => {
  db = pgInstance;
};

const getEvents = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM events;');
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to get events:", err);
    res.status(500).json({ error: "Failed to get events" });
  }
};

const addEvent = async (req, res) => {
  const { title, description, event_date, status, organizer_id, location } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO events (title, description, event_date, status, organizer_id, location)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
      [title, description, event_date, status, organizer_id, location]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Failed to create event:", err.stack || err.message || err);
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
  
};

const updateEvent = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    let fields = [];
    let values = [];
    let index = 1;
    for (const key in updateData) {
      fields.push(`${key} = $${index}`);
      values.push(updateData[key]);
      index++;
    }
    values.push(id);
    const queryText = `UPDATE events SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;`;
    const result = await db.query(queryText, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to update event:", err);
    res.status(500).json({ error: "Failed to update event" });
  }
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM events WHERE id = $1;", [id]);
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("Failed to delete event:", err);
    res.status(500).json({ error: "Failed to delete event" });
  }
};

module.exports = {
  injectDB,
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
};
