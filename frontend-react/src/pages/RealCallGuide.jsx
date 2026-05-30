import React from 'react';

export default function RealCallGuide() {
  return (
    <div className="view-stack animate-page">
      <div className="view-header">
        <div>
          <p className="eyebrow">Demo</p>
          <h2>Prueba de llamada real</h2>
          <p>Guía rápida para probar el flujo completo con Twilio y ngrok.</p>
        </div>
      </div>

      <section className="guide-grid">
        <article className="panel-card">
          <div className="panel-title">
            <h3>Pasos de prueba</h3>
            <span>Flujo completo</span>
          </div>

          <ol className="guide-list">
            <li>Levanta Python en el puerto 8000.</li>
            <li>Levanta Node.js en el puerto 3000.</li>
            <li>Ejecuta ngrok apuntando al puerto 3000.</li>
            <li>Copia la URL HTTPS generada por ngrok.</li>
            <li>Configura el webhook en Twilio.</li>
            <li>Registra tu número en formato E.164.</li>
            <li>Llama al número de Twilio y revisa el panel.</li>
          </ol>
        </article>

        <article className="panel-card">
          <div className="panel-title">
            <h3>Webhook</h3>
            <span>Twilio</span>
          </div>

          <pre className="code-box">
https://TU_URL_NGROK/webhooks/twilio/incoming-call
          </pre>

          <p className="soft-text">
            Reemplaza <strong>TU_URL_NGROK</strong> por la URL HTTPS real.
          </p>
        </article>

        <article className="panel-card">
          <div className="panel-title">
            <h3>Comando ngrok</h3>
            <span>Túnel público</span>
          </div>

          <pre className="code-box">ngrok http 3000</pre>
        </article>

        <article className="panel-card">
          <div className="panel-title">
            <h3>Recarga simulada</h3>
            <span>DTMF</span>
          </div>

          <p className="soft-text">
            Usa datos simulados. No ingreses tarjetas reales.
          </p>

          <pre className="code-box">
4242424242424242#
1228
123
          </pre>
        </article>
      </section>
    </div>
  );
}