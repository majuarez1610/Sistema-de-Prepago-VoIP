import React from 'react';

export default function RealCallGuide() {
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Guía operativa</p>
          <h3>Prueba de llamada real</h3>
          <p>
            Sigue estos pasos para probar el flujo completo desde un celular
            físico hasta la lógica de servicio.
          </p>
        </div>
      </section>

      <div className="info-grid">
        <div className="content-card">
          <h3>Pasos de configuración</h3>
          <ol className="clean-list ordered">
            <li>Ejecuta el servicio Python en el puerto 8000.</li>
            <li>Ejecuta el backend Node.js en el puerto 3000.</li>
            <li>Abre ngrok con el comando indicado.</li>
            <li>Copia la URL pública HTTPS generada por ngrok.</li>
            <li>Configúrala en Twilio como webhook POST.</li>
            <li>Registra el número del abonado en formato E.164.</li>
            <li>Llama al número de Twilio y revisa el monitoreo.</li>
          </ol>
        </div>

        <div className="content-card">
          <h3>Webhook de Twilio</h3>
          <p>Usa este endpoint en la configuración de llamadas entrantes:</p>
          <pre className="code-block">
https://TU_URL_NGROK/webhooks/twilio/incoming-call
          </pre>
        </div>

        <div className="content-card">
          <h3>Comando de ngrok</h3>
          <pre className="code-block">ngrok http 3000</pre>
          <p>
            Asegúrate de que el backend Node.js esté activo antes de lanzar
            ngrok.
          </p>
        </div>

        <div className="content-card">
          <h3>Recomendación</h3>
          <p>
            Si la cuenta de Twilio es trial, algunos números no verificados
            pueden ser rechazados antes del webhook. En ese caso, usa la opción
            <strong> “Sincronizar Twilio” </strong> en la vista de llamadas.
          </p>
        </div>
      </div>
    </div>
  );
}