import React from 'react';

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function decisionBadge(decision) {
  if (decision === 'ALLOW_CALL') {
    return <span className="badge success">Autorizada</span>;
  }

  if (decision === 'REJECT_CALL') {
    return <span className="badge danger">Rechazada</span>;
  }

  return <span className="badge neutral">Sin decisión</span>;
}

function statusBadge(status) {
  const map = {
    completed: ['success', 'Completada'],
    failed: ['danger', 'Fallida'],
    busy: ['warning', 'Ocupado'],
    'no-answer': ['warning', 'Sin respuesta'],
    canceled: ['neutral', 'Cancelada'],
    ringing: ['info', 'Timbrando'],
    queued: ['info', 'En cola'],
    initiated: ['info', 'Iniciada'],
    'in-progress': ['info', 'En curso']
  };

  const [type, label] = map[status] || ['neutral', status || '-'];

  return <span className={`badge ${type}`}>{label}</span>;
}

export default function CallsTable({ calls }) {
  const sorted = [...calls].sort((a, b) => Number(a.id) - Number(b.id));

  return (
    <div className="table-shell">
      <table className="smart-table wide-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>Estado</th>
            <th>Decisión</th>
            <th>Costo</th>
            <th>Motivo</th>
            <th>Fecha</th>
          </tr>
        </thead>

        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan="8" className="empty-cell">
                No hay llamadas registradas.
              </td>
            </tr>
          ) : (
            sorted.map((call) => (
              <tr key={call.id}>
                <td className="id-cell">#{call.id}</td>
                <td className="mono-cell">{call.from_number || '-'}</td>
                <td className="mono-cell">{call.to_number || '-'}</td>
                <td>{statusBadge(call.call_status)}</td>
                <td>{decisionBadge(call.decision)}</td>
                <td className="money-cell">{money(call.cost)}</td>
                <td className="reason-cell">{call.reason || '-'}</td>
                <td className="date-cell">
                  {call.created_at
                    ? new Date(call.created_at).toLocaleString()
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