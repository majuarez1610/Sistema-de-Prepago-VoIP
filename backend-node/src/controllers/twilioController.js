const { pool } = require('../config/db');
const { requestCallDecision } = require('../services/pythonDecisionService');

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildAllowTwiml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">Llamada autorizada. Su saldo es suficiente.</Say>
  <Pause length="1"/>
  <Say language="es-MX">Esta es una demostración del sistema de prepago VoIP basado en Redes Inteligentes. ¿Pero sí se entiende Chimal?</Say>
</Response>`;
}

function buildRejectTwiml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">Llamada rechazada. Saldo insuficiente o usuario no registrado.</Say>
  <Hangup/>
</Response>`;
}

async function saveCallRecord({
  userId,
  fromNumber,
  toNumber,
  twilioCallSid,
  accountSid,
  callStatus,
  direction,
  decision,
  reason,
  cost
}) {
  const query = `
    INSERT INTO calls (
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    userId,
    fromNumber,
    toNumber,
    twilioCallSid,
    accountSid,
    callStatus,
    direction,
    decision,
    reason,
    Number(cost || 0),
    0
  ];

  await pool.execute(query, values);
}

async function processIncomingCallPayload(payload, res) {
  const fromNumber = payload.From || payload.from;
  const toNumber = payload.To || payload.to || null;
  const callSid = payload.CallSid || payload.callSid || null;
  const callStatus = payload.CallStatus || payload.callStatus || null;
  const direction = payload.Direction || payload.direction || null;
  const accountSid = payload.AccountSid || payload.accountSid || null;

  console.log('[TWILIO WEBHOOK] Incoming real call');
  console.log('From:', fromNumber || 'N/A');
  console.log('To:', toNumber || 'N/A');
  console.log('CallSid:', callSid || 'N/A');

  if (!fromNumber) {
    console.log('Decision: REJECT_CALL (From no recibido)');
    res.set('Content-Type', 'text/xml');
    res.status(400).send(buildRejectTwiml());
    return;
  }

  let decisionData;
  try {
    decisionData = await requestCallDecision(fromNumber, toNumber);
  } catch (error) {
    const reason = 'Fallo al consultar el servicio inteligente';
    try {
      await saveCallRecord({
        userId: null,
        fromNumber,
        toNumber,
        twilioCallSid: callSid,
        accountSid,
        callStatus,
        direction,
        decision: 'REJECT_CALL',
        reason,
        cost: 0
      });
    } catch (saveError) {
      console.error('[TWILIO WEBHOOK] No se pudo guardar llamada de rechazo:', saveError.message);
    }
    console.log('Decision: REJECT_CALL');
    res.set('Content-Type', 'text/xml');
    res.status(200).send(buildRejectTwiml());
    return;
  }

  const decision = decisionData.decision === 'ALLOW_CALL' ? 'ALLOW_CALL' : 'REJECT_CALL';
  const reason = decisionData.reason || 'Sin razon disponible';
  const userId = decisionData.user_id || null;
  const cost = decisionData.cost || 0;

  try {
    await saveCallRecord({
      userId,
      fromNumber,
      toNumber,
      twilioCallSid: callSid,
      accountSid,
      callStatus,
      direction,
      decision,
      reason,
      cost
    });
  } catch (saveError) {
    console.error('[TWILIO WEBHOOK] No se pudo guardar llamada:', saveError.message);
  }

  console.log('Decision:', decision);

  res.set('Content-Type', 'text/xml');
  if (decision === 'ALLOW_CALL') {
    res.status(200).send(buildAllowTwiml());
    return;
  }

  res.status(200).send(buildRejectTwiml());
}

async function incomingCall(req, res, next) {
  try {
    await processIncomingCallPayload(req.body, res);
  } catch (error) {
    next(error);
  }
}

async function testIncomingCall(req, res, next) {
  try {
    const simulatedPayload = {
      From: req.query.from,
      To: req.query.to,
      CallSid: 'TEST_CALL_SID',
      CallStatus: 'ringing',
      Direction: 'inbound-api',
      AccountSid: 'TEST_ACCOUNT_SID'
    };

    await processIncomingCallPayload(simulatedPayload, res);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  incomingCall,
  testIncomingCall,
  escapeXml
};
