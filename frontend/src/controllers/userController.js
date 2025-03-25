let db;

const injectDB = (pgInstance) => {
  db = pgInstance;
};

const getUser = async (req, res) => {
    const { email } = req.query; // Grab the email query param
  
    try {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(result.rows[0]); // Return the matched user
    } catch (err) {
      console.error("Failed to get user:", err);
      res.status(500).json({ error: 'Failed to get user' });
    }
  };
  
  

const setPreference = async (req, res) => {
  const { userId, preference } = req.body;

  try {
    await db.query('UPDATE users SET preference = $1 WHERE id = $2', [preference, userId]);
    res.status(200).json({ message: 'Preference updated successfully' });
  } catch (err) {
    console.error("Error updating preference:", err);
    res.status(500).json({ error: 'Failed to update preference' });
  }
};



module.exports = {
  injectDB,
  getUser,
  setPreference
};
