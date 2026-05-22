import React from 'react';
export default function RealCallGuide() {
  return (
    <div className="guide-card">
      <h3>Configuracion Twilio + ngrok</h3>
      <p>Esta seccion prioriza la llamada real desde celular fisico.</p>
      <ol>
        <li>Abre ngrok: <code>ngrok http 3000</code>.</li>
        <li>Obtiene la URL publica HTTPS de ngrok.</li>
        <li>En Twilio configura webhook POST:</li>
      </ol>
      <pre>https://TU_URL_NGROK/webhooks/twilio/incoming-call</pre>
      <p>Usa formato E.164 para registrar el numero real en users.</p>
    </div>
  );
}

