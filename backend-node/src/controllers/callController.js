const { pool } = require('../config/db');

async function getCalls(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, user_id, from_number, to_number, twilio_call_sid, account_sid, call_status, direction,
              decision, reason, cost, duration_seconds, created_at
       FROM calls
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function getCallById(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, user_id, from_number, to_number, twilio_call_sid, account_sid, call_status, direction,
              decision, reason, cost, duration_seconds, created_at
       FROM calls
       WHERE id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      res.status(404).json({ error: 'Llamada no encontrada' });
      return;
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCalls,
  getCallById
};
