const { pool } = require('../config/db');
const { requestCallDecision } = require('../services/pythonDecisionService');

const RECHARGE_PACKAGES = {
  '1': 5.00,
  '2': 10.00,
  '3': 15.00,
  '4': 20.00
};

const rechargeSessions = new Map();

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function getCallSid(payload) {
  return payload.CallSid || payload.callSid || 'UNKNOWN_CALL_SID';
}

function getFromNumber(payload) {
  return payload.From || payload.from || null;
}

function buildHangupTwiml(message) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">${escapeXml(message)}</Say>
  <Hangup/>
</Response>`;
}

function buildNormalAuthorizedCallTwiml(balance) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">Llamada autorizada. Su saldo actual es de ${escapeXml(formatMoney(balance))} pesos.</Say>
  <Pause length="1"/>
  <Say language="es-MX">Esta es una demostracion del sistema de prepago VoIP basado en Redes Inteligentes.</Say>
</Response>`;
}

function buildRechargeIntentTwiml(message, mode, balance = 0) {
  const actionUrl = `/webhooks/twilio/recharge-intent?mode=${encodeURIComponent(mode)}&balance=${encodeURIComponent(balance)}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">${escapeXml(message)}</Say>
  <Pause length="1"/>
  <Gather input="dtmf" numDigits="1" timeout="10" action="${escapeXml(actionUrl)}" method="POST">
    <Say language="es-MX">Presiona 1 si quieres recargar saldo.</Say>
    <Say language="es-MX">Presiona 2 si no quieres recargar.</Say>
  </Gather>
  ${
    mode === 'continue'
      ? `<Say language="es-MX">No se recibio ninguna opcion. La llamada continuara.</Say>
  <Pause length="1"/>
  <Say language="es-MX">Esta es una demostracion del sistema de prepago VoIP basado en Redes Inteligentes.</Say>`
      : `<Say language="es-MX">No se recibio ninguna opcion. La llamada terminara. Hasta luego.</Say>
  <Hangup/>`
  }
</Response>`;
}

function buildRechargePackageMenuTwiml(message) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">${escapeXml(message)}</Say>
  <Pause length="1"/>
  <Gather input="dtmf" numDigits="1" timeout="10" action="/webhooks/twilio/recharge-choice" method="POST">
    <Say language="es-MX">Elige el paquete de recarga.</Say>
    <Say language="es-MX">Presiona 1 para recargar 5 pesos.</Say>
    <Say language="es-MX">Presiona 2 para recargar 10 pesos.</Say>
    <Say language="es-MX">Presiona 3 para recargar 15 pesos.</Say>
    <Say language="es-MX">Presiona 4 para recargar 20 pesos.</Say>
    <Say language="es-MX">Presiona 5 para cancelar.</Say>
  </Gather>
  <Say language="es-MX">No se recibio ninguna opcion. Hasta luego.</Say>
  <Hangup/>
</Response>`;
}

function buildAskCardNumberTwiml(amount) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">Seleccionaste una recarga de ${escapeXml(formatMoney(amount))} pesos.</Say>
  <Gather input="dtmf" finishOnKey="#" timeout="25" action="/webhooks/twilio/recharge-card-number" method="POST">
    <Say language="es-MX">Ingresa el numero de tu tarjeta y despues presiona la tecla gato.</Say>
    <Say language="es-MX">Esta es una simulacion. No ingreses datos reales.</Say>
  </Gather>
  <Say language="es-MX">No se recibio el numero de tarjeta. Hasta luego.</Say>
  <Hangup/>
</Response>`;
}

function buildRetryCardNumberTwiml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">El numero de tarjeta no es valido.</Say>
  <Gather input="dtmf" finishOnKey="#" timeout="25" action="/webhooks/twilio/recharge-card-number" method="POST">
    <Say language="es-MX">Ingresa nuevamente el numero de tu tarjeta y despues presiona la tecla gato.</Say>
    <Say language="es-MX">Esta es una simulacion. No ingreses datos reales.</Say>
  </Gather>
  <Say language="es-MX">No se recibio el numero de tarjeta. Hasta luego.</Say>
  <Hangup/>
</Response>`;
}

function buildAskExpiryTwiml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="dtmf" numDigits="4" timeout="15" action="/webhooks/twilio/recharge-expiry" method="POST">
    <Say language="es-MX">Ingresa la fecha de vencimiento de tu tarjeta en formato mes y año.</Say>
    <Say language="es-MX">Por ejemplo, para diciembre de dos mil veintiocho, marca uno dos dos ocho.</Say>
  </Gather>
  <Say language="es-MX">No se recibio la fecha de vencimiento. Hasta luego.</Say>
  <Hangup/>
</Response>`;
}

function buildRetryExpiryTwiml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">La fecha de vencimiento no es valida.</Say>
  <Gather input="dtmf" numDigits="4" timeout="15" action="/webhooks/twilio/recharge-expiry" method="POST">
    <Say language="es-MX">Ingresa nuevamente la fecha de vencimiento en formato mes y año.</Say>
    <Say language="es-MX">Por ejemplo, para diciembre de dos mil veintiocho, marca uno dos dos ocho.</Say>
  </Gather>
  <Say language="es-MX">No se recibio la fecha de vencimiento. Hasta luego.</Say>
  <Hangup/>
</Response>`;
}

function buildAskCvvTwiml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="dtmf" numDigits="3" timeout="15" action="/webhooks/twilio/recharge-cvv" method="POST">
    <Say language="es-MX">Ingresa el codigo de seguridad de tres digitos.</Say>
  </Gather>
  <Say language="es-MX">No se recibio el codigo de seguridad. Hasta luego.</Say>
  <Hangup/>
</Response>`;
}

function buildRetryCvvTwiml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">El codigo de seguridad no es valido.</Say>
  <Gather input="dtmf" numDigits="3" timeout="15" action="/webhooks/twilio/recharge-cvv" method="POST">
    <Say language="es-MX">Ingresa nuevamente el codigo de seguridad de tres digitos.</Say>
  </Gather>
  <Say language="es-MX">No se recibio el codigo de seguridad. Hasta luego.</Say>
  <Hangup/>
</Response>`;
}

function buildAllowTwiml(decisionData = {}) {
  const balance = formatMoney(decisionData.current_balance);
  const alertMessage = decisionData.alert_message || '';

  if (decisionData.balance_alert === 'LOW_BALANCE') {
    return buildRechargeIntentTwiml(
      `${alertMessage} Deseas recargar saldo en este momento?`,
      'continue',
      balance
    );
  }

  if (decisionData.balance_alert === 'NO_BALANCE') {
    return buildRechargeIntentTwiml(
      `${alertMessage} Deseas recargar saldo en este momento?`,
      'hangup',
      balance
    );
  }

  return buildNormalAuthorizedCallTwiml(balance);
}

function buildRejectTwiml(decisionData = {}) {
  const reason = decisionData.reason || '';
  const alertMessage = decisionData.alert_message || '';

  if (decisionData.balance_alert === 'NO_BALANCE') {
    return buildRechargeIntentTwiml(
      `${alertMessage || 'Ya no tienes saldo disponible.'} Deseas recargar saldo en este momento?`,
      'hangup',
      decisionData.current_balance || 0
    );
  }

  if (decisionData.balance_alert === 'USER_NOT_FOUND') {
    return buildHangupTwiml('Llamada rechazada. Tu numero no esta registrado en el sistema.');
  }

  if (decisionData.balance_alert === 'INACTIVE_USER') {
    return buildHangupTwiml('Llamada rechazada. Tu usuario esta inactivo.');
  }

  return buildHangupTwiml(
    `Llamada rechazada. ${reason || 'Saldo insuficiente o usuario no registrado'}.`
  );
}

function isValidCardNumber(cardNumber) {
  return /^\d{13,19}$/.test(cardNumber);
}

function isValidExpiry(expiry) {
  if (!/^\d{4}$/.test(expiry)) return false;

  const month = Number(expiry.substring(0, 2));

  return month >= 1 && month <= 12;
}

function isValidCvv(cvv) {
  return /^\d{3}$/.test(cvv);
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

async function simulateRecharge(phoneNumber, amount) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [users] = await connection.execute(
      'SELECT id, balance FROM users WHERE phone_number = ? LIMIT 1 FOR UPDATE',
      [phoneNumber]
    );

    if (!users.length) {
      throw new Error('Usuario no encontrado para recarga');
    }

    const user = users[0];

    await connection.execute(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [Number(amount), user.id]
    );

    await connection.execute(
      'INSERT INTO recharges (user_id, amount) VALUES (?, ?)',
      [user.id, Number(amount)]
    );

    const [updatedUsers] = await connection.execute(
      'SELECT id, name, phone_number, balance, status FROM users WHERE id = ? LIMIT 1',
      [user.id]
    );

    await connection.commit();

    return updatedUsers[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
    res.set('Content-Type', 'text/xml');
    res.status(400).send(buildHangupTwiml('No se recibio el numero de origen.'));
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

    res.set('Content-Type', 'text/xml');
    res.status(200).send(buildHangupTwiml('No fue posible consultar el servicio inteligente.'));
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
  console.log('Balance alert:', decisionData.balance_alert || 'NONE');
  console.log('Alert message:', decisionData.alert_message || 'N/A');

  res.set('Content-Type', 'text/xml');

  if (decision === 'ALLOW_CALL') {
    res.status(200).send(buildAllowTwiml(decisionData));
    return;
  }

  res.status(200).send(buildRejectTwiml(decisionData));
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

async function rechargeIntent(req, res, next) {
  try {
    const digits = req.body.Digits;
    const mode = req.query.mode || 'hangup';
    const balance = req.query.balance || 0;

    res.set('Content-Type', 'text/xml');

    if (digits === '1') {
      res.status(200).send(
        buildRechargePackageMenuTwiml('Selecciona el paquete que deseas recargar.')
      );
      return;
    }

    if (digits === '2') {
      if (mode === 'continue') {
        res.status(200).send(buildNormalAuthorizedCallTwiml(balance));
        return;
      }

      res.status(200).send(
        buildHangupTwiml('No se realizo ninguna recarga. La llamada terminara. Hasta luego.')
      );
      return;
    }

    res.status(200).send(
      buildRechargeIntentTwiml(
        'Opcion no valida. Presiona 1 para recargar saldo o 2 para no recargar.',
        mode,
        balance
      )
    );
  } catch (error) {
    next(error);
  }
}

async function rechargeChoice(req, res, next) {
  try {
    const digits = req.body.Digits;
    const fromNumber = getFromNumber(req.body);
    const callSid = getCallSid(req.body);
    const selectedAmount = RECHARGE_PACKAGES[digits];

    res.set('Content-Type', 'text/xml');

    if (digits === '5') {
      res.status(200).send(buildHangupTwiml('No se realizo ninguna recarga. Hasta luego.'));
      return;
    }

    if (!selectedAmount) {
      res.status(200).send(
        buildRechargePackageMenuTwiml('Opcion no valida. Intenta nuevamente.')
      );
      return;
    }

    if (!fromNumber) {
      res.status(200).send(
        buildHangupTwiml('No se pudo identificar tu numero. No es posible realizar la recarga.')
      );
      return;
    }

    rechargeSessions.set(callSid, {
      fromNumber,
      amount: selectedAmount,
      createdAt: Date.now(),
      cardCaptured: false,
      expiryCaptured: false,
      cvvCaptured: false
    });

    console.log('[RECHARGE] Inicio de recarga simulada');
    console.log('From:', fromNumber);
    console.log('CallSid:', callSid);
    console.log('Amount:', formatMoney(selectedAmount));

    res.status(200).send(buildAskCardNumberTwiml(selectedAmount));
  } catch (error) {
    next(error);
  }
}

async function rechargeCardNumber(req, res, next) {
  try {
    const callSid = getCallSid(req.body);
    const cardNumber = req.body.Digits || '';
    const session = rechargeSessions.get(callSid);

    res.set('Content-Type', 'text/xml');

    if (!session) {
      res.status(200).send(
        buildHangupTwiml('No se encontro una sesion de recarga activa. Intenta de nuevo.')
      );
      return;
    }

    if (!isValidCardNumber(cardNumber)) {
      res.status(200).send(buildRetryCardNumberTwiml());
      return;
    }

    session.cardCaptured = true;
    rechargeSessions.set(callSid, session);

    console.log('[RECHARGE] Numero de tarjeta recibido. No se almaceno.');

    res.status(200).send(buildAskExpiryTwiml());
  } catch (error) {
    next(error);
  }
}

async function rechargeExpiry(req, res, next) {
  try {
    const callSid = getCallSid(req.body);
    const expiry = req.body.Digits || '';
    const session = rechargeSessions.get(callSid);

    res.set('Content-Type', 'text/xml');

    if (!session || !session.cardCaptured) {
      res.status(200).send(
        buildHangupTwiml('No se encontro una sesion de recarga valida. Intenta de nuevo.')
      );
      return;
    }

    if (!isValidExpiry(expiry)) {
      res.status(200).send(buildRetryExpiryTwiml());
      return;
    }

    session.expiryCaptured = true;
    rechargeSessions.set(callSid, session);

    console.log('[RECHARGE] Fecha de vencimiento recibida. No se almaceno.');

    res.status(200).send(buildAskCvvTwiml());
  } catch (error) {
    next(error);
  }
}

async function rechargeCvv(req, res, next) {
  try {
    const callSid = getCallSid(req.body);
    const cvv = req.body.Digits || '';
    const session = rechargeSessions.get(callSid);

    res.set('Content-Type', 'text/xml');

    if (!session || !session.cardCaptured || !session.expiryCaptured) {
      res.status(200).send(
        buildHangupTwiml('No se encontro una sesion de recarga valida. Intenta de nuevo.')
      );
      return;
    }

    if (!isValidCvv(cvv)) {
      res.status(200).send(buildRetryCvvTwiml());
      return;
    }

    session.cvvCaptured = true;

    console.log('[RECHARGE] CVV recibido. No se almaceno.');
    console.log('[RECHARGE] Procesando recarga simulada.');

    const updatedUser = await simulateRecharge(session.fromNumber, session.amount);

    rechargeSessions.delete(callSid);

    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">Recarga aprobada.</Say>
  <Say language="es-MX">Se agregaron ${escapeXml(formatMoney(session.amount))} pesos a tu cuenta.</Say>
  <Say language="es-MX">Tu nuevo saldo es de ${escapeXml(formatMoney(updatedUser.balance))} pesos.</Say>
  <Pause length="1"/>
  <Say language="es-MX">Gracias por usar el sistema de prepago VoIP.</Say>
  <Hangup/>
</Response>`);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  incomingCall,
  testIncomingCall,
  rechargeIntent,
  rechargeChoice,
  rechargeCardNumber,
  rechargeExpiry,
  rechargeCvv,
  escapeXml
};