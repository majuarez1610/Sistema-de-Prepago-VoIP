const { pool } = require('../config/db');

function getSchedule(hour) {
  if (hour >= 0 && hour < 6) return 'Madrugada (00-06h)';
  if (hour >= 6 && hour < 12) return 'Mañana (06-12h)';
  if (hour >= 12 && hour < 18) return 'Tarde (12-18h)';
  return 'Noche (18-00h)';
}

async function handleIncomingIVR(req, res, next) {
  try {
    const fromNumber = req.body.From || req.body.from;
    const toNumber = req.body.To || req.body.to || ''; 
    
    console.log(`\n📞 [IVR FILTRO] Nueva llamada entrante desde: ${fromNumber}`);

    // 1. ANALIZAR HISTORIAL EN MYSQL
    const [rows] = await pool.execute(
      `SELECT HOUR(created_at) as hour, COUNT(*) as total 
       FROM calls 
       GROUP BY HOUR(created_at)`
    );

    const trafficBlocks = {
      'Madrugada (00-06h)': 0,
      'Mañana (06-12h)': 0,
      'Tarde (12-18h)': 0,
      'Noche (18-00h)': 0
    };

    rows.forEach(row => {
      const block = getSchedule(row.hour);
      trafficBlocks[block] += row.total;
    });

    const mostSaturatedBlock = Object.keys(trafficBlocks).reduce((a, b) => trafficBlocks[a] >= trafficBlocks[b] ? a : b);
    const maxCalls = trafficBlocks[mostSaturatedBlock];

    console.log(`📊 [SCP Análisis] Tráfico histórico:`, trafficBlocks);
    console.log(`🔥 [SCP Análisis] Bloque pico: ${mostSaturatedBlock} (${maxCalls} llamadas)`);

    const currentHour = new Date().getHours();
    const currentBlock = getSchedule(currentHour);
    console.log(`⏰ [SCP] Bloque actual del usuario: ${currentBlock}`);

    res.set('Content-Type', 'text/xml');

    // =====================================================================
    // CASO A: ESCENARIO DE HORA PICO (SE ACTIVA LA ADVERTENCIA DE LOS $2)
    // =====================================================================
    if (currentBlock === mostSaturatedBlock) {
      console.log(`⚠️ ALERTA SCP: Coincidencia de hora pico. Disparando IVR interactivo.`);
      
      
      const twimlGather = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="/webhooks/twilio/ivr-decision" method="POST" timeout="10">
    <Say language="es-MX">Atención. En este horario de alta demanda la cuota es mayor y vale dos pesos por minuto.</Say>
    <Say language="es-MX">Si deseas continuar con la llamada y aceptas el cargo, presiona 3.</Say>
  </Gather>
  <Say language="es-MX">No se detectó ninguna respuesta. Llamada finalizada.</Say>
  <Hangup/>
</Response>`;
      
      res.status(200).send(twimlGather);
      return;
    } 
    
    // =====================================================================
    // CASO B: HORARIO REGULAR LIBRE (SALTA DIRECTO A TU LOGICA ORIGINAL)
    // =====================================================================
    else {
      console.log(`✅ SCP: Horario libre. Transfiriendo directo a twilioController...`);
      
          const twimlRedirect = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Redirect method="POST">/webhooks/twilio/incoming-call?schedule=false</Redirect>
        </Response>`;
          res.status(200).send(twimlRedirect);
    }

  } catch (error) {
    next(error);
  }
}

async function handleIVRDecision(req, res, next) {
  try {
    const presseddigit = req.body.Digits;
    console.log(`⌨️ [IVR RESPUESTA] Tecla presionada por el cliente: ${presseddigit}`);

    res.set('Content-Type', 'text/xml');

    // =====================================================================
    // SI EL USUARIO ACEPTÓ (OPRIMIÓ EL 3): SE VA A TU FLUJO ORIGINAL
    // =====================================================================
    if (presseddigit === '3') {
      console.log(`🚀 [SCP] Tarifa aceptada. Transfiriendo llamada al flujo de twilioController...`);
      
     const twimlAceptado = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">Aceptado. Validando sus credenciales de prepago.</Say>
  <Redirect method="POST">/webhooks/twilio/incoming-call?schedule=true</Redirect>
</Response>`;
      
      res.status(200).send(twimlAceptado);
      return;
    } 
    
    // =====================================================================
    // SI SE EQUIVOCÓ DE TECLA (NO FUE EL 3): SE CUELGA DE INMEDIATO
    // =====================================================================
    else {
      console.log(`❌ [SCP] Tecla incorrecta (${presseddigit}). Rechazando enrutamiento.`);
      
      const twimlRechazado = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">Selección inválida. Llamada finalizada.</Say>
  <Hangup/>
</Response>`;
      
      res.status(200).send(twimlRechazado);
    }
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleIncomingIVR,
  handleIVRDecision
};