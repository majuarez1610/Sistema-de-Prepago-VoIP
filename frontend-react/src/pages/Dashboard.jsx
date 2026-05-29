import React from 'react';

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export default function Dashboard({ users, calls, decisions }) {
  const authorizedCalls = calls.filter(
    (item) => item.decision === 'ALLOW_CALL'
  ).length;

  const rejectedCalls = calls.filter(
    (item) => item.decision === 'REJECT_CALL'
  ).length;

  const completedCalls = calls.filter(
    (item) => item.call_status === 'completed'
  ).length;

  const failedCalls = calls.filter(
    (item) => item.call_status === 'failed'
  ).length;

  const activeUsers = users.filter((item) => item.status === 'active').length;
  const inactiveUsers = users.filter((item) => item.status === 'inactive').length;

  const recentCalls = calls.slice(0, 5);

  return (
    <div className="page-stack animate-in">
      <section className="hero-panel dashboard-hero">
        <div>
          <p className="eyebrow">Monitoreo general</p>
          <h3>Centro de control de la Red Inteligente</h3>
          <p>
            Vista general del sistema de prepago VoIP con señalización, lógica
            SCF, base SDF y monitoreo de eventos.
          </p>
        </div>

        <div className="hero-orb">
          <span>SCF</span>
        </div>
      </section>

      <section className="metrics-grid">
        <div className="metric-card">
          <p>Usuarios registrados</p>
          <strong>{users.length}</strong>
          <span>Abonados provisionados</span>
        </div>

        <div className="metric-card">
          <p>Llamadas registradas</p>
          <strong>{calls.length}</strong>
          <span>Eventos sincronizados</span>
        </div>

        <div className="metric-card">
          <p>Servicio autorizado</p>
          <strong>{authorizedCalls}</strong>
          <span>Sesiones permitidas</span>
        </div>

        <div className="metric-card">
          <p>Servicio denegado</p>
          <strong>{rejectedCalls}</strong>
          <span>Control de admisión</span>
        </div>
      </section>

      <section className="info-grid">
        <div className="content-card">
          <h3>Distribución de decisiones</h3>

          <div className="chart-row">
            <div className="chart-label">
              <span>Autorizadas</span>
              <strong>{percent(authorizedCalls, calls.length)}%</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill success"
                style={{ width: `${percent(authorizedCalls, calls.length)}%` }}
              />
            </div>
          </div>

          <div className="chart-row">
            <div className="chart-label">
              <span>Denegadas</span>
              <strong>{percent(rejectedCalls, calls.length)}%</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill danger"
                style={{ width: `${percent(rejectedCalls, calls.length)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="content-card">
          <h3>Estado de señalización</h3>

          <div className="chart-row">
            <div className="chart-label">
              <span>Sesiones establecidas</span>
              <strong>{percent(completedCalls, calls.length)}%</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill info"
                style={{ width: `${percent(completedCalls, calls.length)}%` }}
              />
            </div>
          </div>

          <div className="chart-row">
            <div className="chart-label">
              <span>Liberación / fallo</span>
              <strong>{percent(failedCalls, calls.length)}%</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill warning"
                style={{ width: `${percent(failedCalls, calls.length)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="content-card">
          <h3>Usuarios en SDF</h3>

          <div className="donut-layout">
            <div
              className="donut"
              style={{
                background: `conic-gradient(
                  #22c55e 0deg ${percent(activeUsers, users.length) * 3.6}deg,
                  #ef4444 ${percent(activeUsers, users.length) * 3.6}deg 360deg
                )`
              }}
            >
              <span>{percent(activeUsers, users.length)}%</span>
            </div>

            <div>
              <p><strong>{activeUsers}</strong> usuarios activos</p>
              <p><strong>{inactiveUsers}</strong> usuarios inactivos</p>
            </div>
          </div>
        </div>

        <div className="content-card">
          <h3>Últimos eventos</h3>

          <div className="timeline">
            {recentCalls.length === 0 ? (
              <p>No hay eventos recientes.</p>
            ) : (
              recentCalls.map((item) => (
                <div className="timeline-item" key={item.id}>
                  <span className={item.decision === 'ALLOW_CALL' ? 'node ok' : 'node danger'}></span>
                  <div>
                    <strong>{item.from_number}</strong>
                    <p>
                      {item.decision === 'ALLOW_CALL'
                        ? 'Servicio autorizado'
                        : 'Servicio denegado'}{' '}
                      · {item.call_status || 'sin estado'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="content-card wide-card">
          <h3>Arquitectura lógica del sistema</h3>

          <div className="flow-grid premium-flow">
            <div className="flow-step">Celular / Abonado</div>
            <div className="flow-step">Twilio / SSP</div>
            <div className="flow-step">Node.js / Webhook</div>
            <div className="flow-step">Python / SCF</div>
            <div className="flow-step">MySQL / SDF</div>
            <div className="flow-step">TwiML / Respuesta</div>
          </div>
        </div>
      </section>
    </div>
  );
}