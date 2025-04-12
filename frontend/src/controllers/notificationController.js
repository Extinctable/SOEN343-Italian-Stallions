// /controllers/notificationController.js
let db;

const injectDB = (pgInstance) => {
  db = pgInstance;
};

const addNotification = async (notificationData) => {
  const { user_id, event_id, message } = notificationData;
  const insertQuery = `
    INSERT INTO notifications (user_id, event_id, message)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const result = await db.query(insertQuery, [user_id, event_id, message]);
  return result.rows[0];
};

const getNotifications = async (req, res) => {
  const { user_id } = req.query;
  try {
    const result = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC;`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

const markAsRead = async (req, res) => {
  const { notification_id } = req.params;
  try {
    const result = await db.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *;`,
      [notification_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
};

module.exports = {
  injectDB,
  addNotification,
  getNotifications,
  markAsRead,
};
