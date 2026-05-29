const { pool } = require('../config/db');
const { syncTwilioCalls: syncTwilioCallsService } = require('../services/twilioCallSyncService');

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

async function syncTwilioCalls(req, res, next) {
  try {
    const result = await syncTwilioCallsService({
      pageSize: req.body?.pageSize || req.query?.pageSize || 50,
      to: req.body?.to || req.query?.to,
      from: req.body?.from || req.query?.from,
      status: req.body?.status || req.query?.status,
      startTimeAfter: req.body?.startTimeAfter || req.query?.startTimeAfter
    });

    res.json({
      message: 'Sincronizacion con Twilio completada',
      ...result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCalls,
  getCallById,
  syncTwilioCalls
};