let db;

const injectDB = (pgInstance) => {
  db = pgInstance;
};

const getUserPayments = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM user_payments;");
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to get user payments:", err);
    res.status(500).json({ error: "Failed to get user payments" });
  }
};

const addUserPayment = async (req, res) => {
  const { user_id, event_id, payment_method, amount } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO user_payments (user_id, event_id, payment_method, amount)
       VALUES ($1, $2, $3, $4) RETURNING *;`,
      [user_id, event_id, payment_method, amount]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to add user payment:", err);
    res.status(500).json({ error: "Failed to add user payment" });
  }
};

const updateUserPayment = async (req, res) => {
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
    const queryText = `UPDATE user_payments SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;`;
    const result = await db.query(queryText, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User payment not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to update user payment:", err);
    res.status(500).json({ error: "Failed to update user payment" });
  }
};

const deleteUserPayment = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM user_payments WHERE id = $1;", [id]);
    res.json({ message: "User payment deleted successfully" });
  } catch (err) {
    console.error("Failed to delete user payment:", err);
    res.status(500).json({ error: "Failed to delete user payment" });
  }
};

module.exports = {
  injectDB,
  getUserPayments,
  addUserPayment,
  updateUserPayment,
  deleteUserPayment,
};
