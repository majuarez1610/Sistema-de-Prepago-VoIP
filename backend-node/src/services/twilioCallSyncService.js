const axios = require('axios');
const { pool } = require('../config/db');

const TWILIO_API_BASE_URL = 'https://api.twilio.com/2010-04-01';
const FINAL_REJECT_STATUSES = new Set(['failed', 'busy', 'no-answer', 'canceled']);

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken) {
    throw new Error('Faltan TWILIO_ACCOUNT_SID y/o TWILIO_AUTH_TOKEN en backend-node/.env');
  }

  return { accountSid, authToken, phoneNumber };
}

function limitText(value, maxLength) {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value).slice(0, maxLength);
}

function normalizeDuration(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

function buildImportedDecision({ call, userId }) {
  const status = String(call.status || 'unknown').toLowerCase();
  const errorCode = call.error_code || call.errorCode || null;

  if (Number(errorCode) === 21264) {
    return {
      decision: 'REJECT_CALL',
      reason:
        'SSF registró intento de llamada; SCF denegó el servicio por origen no provisionado en SDF. Orden lógica: ReleaseCall.'
    };
  }

  if (!userId && FINAL_REJECT_STATUSES.has(status)) {
    return {
      decision: 'REJECT_CALL',
      reason:
        'Control de admisión: abonado origen no provisionado en SDF; se libera la sesión sin asignación de recursos de media.'
    };
  }

  if (FINAL_REJECT_STATUSES.has(status)) {
    return {
      decision: 'REJECT_CALL',
      reason:
        `Liberación en control de llamada: intento registrado en señalización; no se alcanzó estado ANM/200 OK. Estado: ${status}.`
    };
  }

  if (!userId) {
    return {
      decision: 'REJECT_CALL',
      reason:
        'SCF denegó el establecimiento: abonado origen no encontrado en SDF; política de servicio no autorizada.'
    };
  }

  return {
    decision: 'ALLOW_CALL',
    reason:
      'SCF autorizó el establecimiento: abonado validado en SDF; servicio permitido y sesión asociada al usuario.'
  };
}


async function fetchTwilioCalls({ pageSize = 50, to, from, status, startTimeAfter } = {}) {
  const { accountSid, authToken, phoneNumber } = getTwilioConfig();

  const safePageSize = Math.min(Math.max(Number(pageSize) || 50, 1), 1000);

  const params = {
    PageSize: safePageSize
  };

  const targetNumber = to || phoneNumber;

  if (targetNumber) {
    params.To = targetNumber;
  }

  if (from) {
    params.From = from;
  }

  if (status) {
    params.Status = status;
  }

  if (startTimeAfter) {
    params.StartTimeAfter = startTimeAfter;
  }

  const response = await axios.get(
    `${TWILIO_API_BASE_URL}/Accounts/${accountSid}/Calls.json`,
    {
      auth: {
        username: accountSid,
        password: authToken
      },
      params,
      timeout: 15000
    }
  );

  return response.data.calls || [];
}

async function findUserIdByPhoneNumber(connection, phoneNumber) {
  if (!phoneNumber) {
    return null;
  }

  const [users] = await connection.execute(
    'SELECT id FROM users WHERE phone_number = ? LIMIT 1',
    [phoneNumber]
  );

  return users.length ? users[0].id : null;
}

async function upsertTwilioCall(connection, call) {
  const twilioCallSid = call.sid;

  if (!twilioCallSid) {
    return {
      action: 'skipped',
      sid: null,
      reason: 'La llamada de Twilio no contiene SID'
    };
  }

  const [existingRows] = await connection.execute(
    'SELECT id, decision, reason FROM calls WHERE twilio_call_sid = ? LIMIT 1',
    [twilioCallSid]
  );

  const fromNumber = limitText(call.from || 'UNKNOWN', 20);
  const toNumber = limitText(call.to, 20);
  const accountSid = limitText(call.account_sid, 100);
  const callStatus = limitText(call.status, 50);
  const direction = limitText(call.direction, 50);
  const durationSeconds = normalizeDuration(call.duration);

  const userId = await findUserIdByPhoneNumber(connection, fromNumber);

  const importedDecision = buildImportedDecision({
    call,
    userId
  });

  if (existingRows.length) {
  const existing = existingRows[0];

  await connection.execute(
    `UPDATE calls
     SET from_number = ?,
         to_number = ?,
         account_sid = ?,
         call_status = ?,
         direction = ?,
         decision = ?,
         reason = ?,
         duration_seconds = ?
     WHERE id = ?`,
    [
      fromNumber,
      toNumber,
      accountSid,
      callStatus,
      direction,
      importedDecision.decision,
      limitText(importedDecision.reason, 255),
      durationSeconds,
      existing.id
    ]
  );

  return {
    action: 'updated',
    id: existing.id,
    sid: twilioCallSid,
    decision: importedDecision.decision,
    reason: importedDecision.reason
  };
}

  const [result] = await connection.execute(
    `INSERT INTO calls (
      user_id,
      from_number,
      to_number,
      twilio_call_sid,
      account_sid,
      call_status,
      direction,
      decision,
      reason,
      cost,
      duration_seconds
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      fromNumber,
      toNumber,
      limitText(twilioCallSid, 100),
      accountSid,
      callStatus,
      direction,
      importedDecision.decision,
      limitText(importedDecision.reason, 255),
      0,
      durationSeconds
    ]
  );

  if (importedDecision.decision === 'REJECT_CALL') {
    await connection.execute(
      `INSERT INTO decision_logs (
        user_id,
        phone_number,
        decision,
        reason,
        balance_before,
        cost
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        fromNumber,
        importedDecision.decision,
        limitText(importedDecision.reason, 255),
        0,
        0
      ]
    );
  }

  return {
    action: 'inserted',
    id: result.insertId,
    sid: twilioCallSid,
    decision: importedDecision.decision,
    reason: importedDecision.reason
  };
}

async function syncTwilioCalls({ pageSize, to, from, status, startTimeAfter } = {}) {
  const calls = await fetchTwilioCalls({
    pageSize,
    to,
    from,
    status,
    startTimeAfter
  });

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const results = [];

    for (const call of calls) {
      results.push(await upsertTwilioCall(connection, call));
    }

    await connection.commit();

    return {
      fetched: calls.length,
      inserted: results.filter((item) => item.action === 'inserted').length,
      updated: results.filter((item) => item.action === 'updated').length,
      skipped: results.filter((item) => item.action === 'skipped').length,
      results
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  syncTwilioCalls,
  fetchTwilioCalls
};