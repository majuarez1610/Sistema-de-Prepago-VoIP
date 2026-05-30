import React from 'react';
import RefreshButton from '../components/RefreshButton';

function percent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total || 1)) * 100);
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function Dashboard({
  users,
  calls,
  decisions,
  analysis,
  loading,
  onRefresh
}) {
  const authorized = calls.filter((item) => item.decision === 'ALLOW_CALL').length;
  const rejected = calls.filter((item) => item.decision === 'REJECT_CALL').length;
  const activeUsers = users.filter((item) => item.status === 'active').length;
  const totalBalance = users.reduce((acc, item) => acc + Number(item.balance || 0), 0);
  const totalCost = calls.reduce((acc, item) => acc + Number(item.cost || 0), 0);

  const recentCalls = [...calls]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 5);

  return (
    <div className="view-stack animate-page">
      <div className="view-header">
        <div>
          <p className="eyebrow">Vista general</p>
          <h2>Centro de control de la Red Inteligente</h2>
          <p>
            Resumen operativo de usuarios, llamadas, decisiones SCF, costos y
            saturación por horario.
          </p>
        </div>

        <RefreshButton onClick={onRefresh} disabled={loading} />
      </div>

      <section className="hero-dashboard">
        <div>
          <span className="hero-kicker">Servicio inteligente activo</span>
          <h3>Monitoreo VoIP prepago en tiempo real</h3>
          <p>
            El sistema evalúa saldo, estado del abonado, horario saturado y
            autorización de llamada antes de responder a Twilio.
          </p>

          <div className="hero-actions">
            <span className="mini-chip">Twilio / SSP</span>
            <span className="mini-chip">Node Webhook</span>
            <span className="mini-chip">Python SCF</span>
            <span className="mini-chip">MySQL SDF</span>
          </div>
        </div>

        <div className="network-orb">
          <span>SCF</span>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Usuarios</span>
          <strong>{users.length}</strong>
          <p>{activeUsers} activos</p>
        </article>

        <article className="stat-card">
          <span>Llamadas</span>
          <strong>{calls.length}</strong>
          <p>{authorized} autorizadas</p>
        </article>

        <article className="stat-card">
          <span>Denegadas</span>
          <strong>{rejected}</strong>
          <p>Control de admisión</p>
        </article>

        <article className="stat-card">
          <span>Saldo total</span>
          <strong>{money(totalBalance)}</strong>
          <p>Usuarios SDF</p>
        </article>

        <article className="stat-card">
          <span>Costo acumulado</span>
          <strong>{money(totalCost)}</strong>
          <p>Eventos cobrados</p>
        </article>

        <article className="stat-card">
          <span>Bloque actual</span>
          <strong className="small-stat">
            {analysis?.current_block?.label || 'Sin datos'}
          </strong>
          <p>{analysis?.current_block?.classification || 'No calculado'}</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-title">
            <h3>Decisiones SCF</h3>
            <span>{calls.length} eventos</span>
          </div>

          <div className="progress-list">
            <div className="progress-row">
              <div>
                <span>Autorizadas</span>
                <strong>{percent(authorized, calls.length)}%</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill success"
                  style={{ width: `${percent(authorized, calls.length)}%` }}
                />
              </div>
            </div>

            <div className="progress-row">
              <div>
                <span>Rechazadas</span>
                <strong>{percent(rejected, calls.length)}%</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill danger"
                  style={{ width: `${percent(rejected, calls.length)}%` }}
                />
              </div>
            </div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-title">
            <h3>Eventos recientes</h3>
            <span>Últimas llamadas</span>
          </div>

          <div className="event-list">
            {recentCalls.length === 0 ? (
              <div className="empty-box">Todavía no hay llamadas.</div>
            ) : (
              recentCalls.map((call) => (
                <div className="event-item" key={call.id}>
                  <div
                    className={`event-dot ${
                      call.decision === 'ALLOW_CALL' ? 'ok' : 'bad'
                    }`}
                  />
                  <div>
                    <strong>{call.from_number || 'Sin origen'}</strong>
                    <p>{call.reason || 'Sin motivo registrado'}</p>
                  </div>
                  <span>#{call.id}</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel-card wide">
          <div className="panel-title">
            <h3>Flujo lógico del sistema</h3>
            <span>Red Inteligente simulada</span>
          </div>

          <div className="flow-map">
            <div>📱 Abonado</div>
            <div>📡 Twilio SSP</div>
            <div>🌐 Node.js</div>
            <div>🧠 Python SCF</div>
            <div>🗄️ MySQL SDF</div>
            <div>📄 TwiML</div>
          </div>
        </article>
      </section>
    </div>
  );
}