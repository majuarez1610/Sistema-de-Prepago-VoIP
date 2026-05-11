export default function Dashboard({ usersCount, callsCount, decisionsCount }) {
  return (
    <div className="page-grid">
      <div className="metric-card">
        <p>Usuarios registrados</p>
        <strong>{usersCount}</strong>
      </div>
      <div className="metric-card">
        <p>Llamadas registradas</p>
        <strong>{callsCount}</strong>
      </div>
      <div className="metric-card">
        <p>Decisiones SCF</p>
        <strong>{decisionsCount}</strong>
      </div>

      <div className="guide-card">
        <h3>Prueba de llamada real (flujo principal)</h3>
        <ol>
          <li>Ejecutar el servicio Python FastAPI en puerto 8000.</li>
          <li>Ejecutar el backend Node.js en puerto 3000.</li>
          <li>Ejecutar <code>ngrok http 3000</code>.</li>
          <li>Configurar la URL publica en Twilio como webhook POST.</li>
          <li>Registrar tu numero real en users, formato E.164.</li>
          <li>Llamar desde tu celular al numero de Twilio.</li>
        </ol>
      </div>
    </div>
  );
}
