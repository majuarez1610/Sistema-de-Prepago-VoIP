import React from 'react';

function formatStatus(status) {
  if (!status) return <span className="badge neutral">-</span>;

  const labels = {
    completed: 'Sesión establecida',
    failed: 'Liberación / fallo',
    busy: 'Destino ocupado',
    'no-answer': 'Sin respuesta',
    canceled: 'Cancelada',
    ringing: 'Timbrando',
    queued: 'En cola',
    initiated: 'Iniciada',
    'in-progress': 'En curso'
  };

  const variants = {
    completed: 'success',
    failed: 'danger',
    busy: 'warning',
    'no-answer': 'warning',
    canceled: 'neutral',
    ringing: 'info',
    queued: 'info',
    initiated: 'info',
    'in-progress': 'info'
  };

  return (
    <span className={`badge ${variants[status] || 'neutral'}`}>
      {labels[status] || status}
    </span>
  );
}

function formatDirection(direction) {
  if (!direction) return '-';

  const labels = {
    inbound: 'Entrante',
    outbound: 'Saliente'
  };

  return labels[direction] || direction;
}

function formatDecision(decision) {
  if (!decision) return <span className="badge neutral">-</span>;

  const labels = {
    ALLOW_CALL: 'Servicio autorizado',
    REJECT_CALL: 'Servicio denegado'
  };

  const variants = {
    ALLOW_CALL: 'success',
    REJECT_CALL: 'danger'
  };

  return (
    <span className={`badge ${variants[decision] || 'neutral'}`}>
      {labels[decision] || decision}
    </span>
  );
}

export default function CallsTable({ calls }) {
  const sortedCalls = [...calls].sort(
    (a, b) => Number(a.id) - Number(b.id)
  );

  return (
    <div className="table-card">
      <div className="table-header">
        <div>
          <h3>Registro de eventos de señalización</h3>
          <p>
            Historial de sesiones y decisiones de control asociadas al flujo de
            llamadas.
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>SID de llamada</th>
            <th>Estado de señalización</th>
            <th>Dirección</th>
            <th>Decisión SCF</th>
            <th>Motivo técnico</th>
            <th>Duración</th>
            <th>Fecha</th>
          </tr>
        </thead>

        <tbody>
          {sortedCalls.length === 0 ? (
            <tr>
              <td colSpan="10">Sin eventos registrados</td>
            </tr>
          ) : (
            sortedCalls.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.from_number}</td>
                <td>{item.to_number}</td>
                <td className="sid-cell">{item.twilio_call_sid}</td>
                <td>{formatStatus(item.call_status)}</td>
                <td>{formatDirection(item.direction)}</td>
                <td>{formatDecision(item.decision)}</td>
                <td className="reason-cell">{item.reason}</td>
                <td>{Number(item.duration_seconds || 0)} s</td>
                <td>
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}