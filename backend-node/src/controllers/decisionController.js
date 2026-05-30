const { pool } = require('../config/db');

async function getDecisions(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, user_id, phone_number, decision, reason, balance_before, cost, created_at
       FROM decision_logs
       ORDER BY id ASC`
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDecisions
};