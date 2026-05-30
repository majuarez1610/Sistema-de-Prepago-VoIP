const { getTrafficAnalysis } = require('../services/scheduleAnalysisService');
const { saveCallRecord, escapeXml } = require('./twilioController');

function buildSaturatedScheduleTwiml(analysis) {
  const currentBlock = analysis?.current_block?.label || 'el horario actual';
  const currentHour = analysis?.current_hour_label || 'esta hora';
  const peakBlock = analysis?.peak_block?.label || currentBlock;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="/webhooks/twilio/ivr-decision" method="POST" timeout="10" actionOnEmptyResult="true">
    <Say language="es-MX">Análisis de red completado.</Say>
    <Say language="es-MX">La llamada se está realizando en ${escapeXml(currentBlock)}, correspondiente a ${escapeXml(currentHour)}.</Say>
    <Say language="es-MX">El sistema detectó saturación en este bloque horario.</Say>
    <Say language="es-MX">El bloque con mayor tráfico registrado es ${escapeXml(peakBlock)}.</Say>
    <Say language="es-MX">En este horario de alta demanda la cuota vale dos pesos por llamada.</Say>
    <Say language="es-MX">Si deseas continuar con la llamada y aceptas el cargo, presiona 3.</Say>
  </Gather>
  <Say language="es-MX">No se detectó ninguna respuesta. Llamada finalizada.</Say>
  <Hangup/>
</Response>`;
}

function buildNormalScheduleTwiml(analysis) {
  const currentBlock = analysis?.current_block?.label || 'el horario actual';
  const currentHour = analysis?.current_hour_label || 'esta hora';

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">Análisis de red completado.</Say>
  <Say language="es-MX">La llamada se está realizando en ${escapeXml(currentBlock)}, correspondiente a ${escapeXml(currentHour)}.</Say>
  <Say language="es-MX">El sistema no detectó saturación en este bloque horario.</Say>
  <Say language="es-MX">Se aplicará la tarifa regular de un peso por llamada.</Say>
  <Pause length="1"/>
  <Redirect method="POST">/webhooks/twilio/incoming-call?schedule=false</Redirect>
</Response>`;
}

function shouldForceSaturatedSchedule(req) {
  const value = String(req?.query?.forceSaturated || req?.query?.force_saturated || '').toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

async function saveRejectedIvrCall(req, reason) {
  const fromNumber = req.body.From || req.body.from;

  if (!fromNumber) {
    return;
  }

  await saveCallRecord({
    userId: null,
    fromNumber,
    toNumber: req.body.To || req.body.to || null,
    twilioCallSid: req.body.CallSid || req.body.callSid || null,
    accountSid: req.body.AccountSid || req.body.accountSid || null,
    callStatus: req.body.CallStatus || req.body.callStatus || 'rejected',
    direction: req.body.Direction || req.body.direction || 'inbound',
    decision: 'REJECT_CALL',
    reason,
    cost: 0
  });
}

async function handleIncomingIVR(req, res, next) {
  try {
    const fromNumber = req.body.From || req.body.from;

    console.log(`\n📞 [IVR FILTRO] Nueva llamada entrante desde: ${fromNumber || 'N/A'}`);

    const analysis = await getTrafficAnalysis();
    const currentBlock = analysis.current_block;
    const forceSaturated = shouldForceSaturatedSchedule(req);

    console.log('📊 [SCP Análisis] Bloques:', analysis.blocks);
    console.log(`🔥 [SCP Análisis] Bloque actual: ${currentBlock?.label || 'N/A'} (${currentBlock?.total || 0} llamadas)`);
    console.log(`🚦 [SCP Análisis] Clasificación actual: ${currentBlock?.classification || 'N/A'}`);

    res.set('Content-Type', 'text/xml');

    if (forceSaturated || currentBlock?.is_saturated) {
      console.log('⚠️ ALERTA SCP: Horario saturado. Disparando IVR interactivo.');
      res.status(200).send(buildSaturatedScheduleTwiml(analysis));
      return;
    }

    console.log('✅ SCP: Horario normal. Informando horario y transfiriendo a validación de saldo.');
    res.status(200).send(buildNormalScheduleTwiml(analysis));
  } catch (error) {
    next(error);
  }
}

async function handleIVRDecision(req, res, next) {
  try {
    const pressedDigit = req.body.Digits;

    console.log(`⌨️ [IVR RESPUESTA] Tecla presionada por el cliente: ${pressedDigit || 'sin respuesta'}`);

    res.set('Content-Type', 'text/xml');

    if (pressedDigit === '3') {
      console.log('🚀 [SCP] Tarifa aceptada. Transfiriendo llamada al flujo de validación de saldo.');

      const twimlAceptado = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">Tarifa pico aceptada.</Say>
  <Say language="es-MX">Ahora se verificará el saldo del abonado en el sistema de prepago.</Say>
  <Redirect method="POST">/webhooks/twilio/incoming-call?schedule=true</Redirect>
</Response>`;

      res.status(200).send(twimlAceptado);
      return;
    }

    console.log(`❌ [SCP] Tarifa pico no aceptada. Respuesta recibida: ${pressedDigit || 'sin respuesta'}.`);

    try {
      await saveRejectedIvrCall(
        req,
        pressedDigit
          ? `Tarifa pico no aceptada. Selección inválida: ${pressedDigit}`
          : 'Tarifa pico no aceptada. Sin respuesta del usuario'
      );
    } catch (saveError) {
      console.error('[IVR RESPUESTA] No se pudo guardar rechazo IVR:', saveError.message);
    }

    const twimlRechazado = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">No se aceptó la tarifa de horario saturado. Llamada finalizada.</Say>
  <Hangup/>
</Response>`;

    res.status(200).send(twimlRechazado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleIncomingIVR,
  handleIVRDecision
};