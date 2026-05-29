import React from 'react';

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
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

export default function DecisionsTable({ decisions }) {
  const sortedDecisions = [...decisions].sort(
    (a, b) => Number(a.id) - Number(b.id)
  );

  return (
    <div className="table-card">
      <div className="table-header">
        <div>
          <h3>Bitácora de decisiones del SCF</h3>
          <p>
            Historial de autorizaciones y denegaciones emitidas por la lógica de
            servicio.
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Abonado</th>
            <th>Decisión</th>
            <th>Saldo previo</th>
            <th>Costo</th>
            <th>Motivo</th>
            <th>Fecha</th>
          </tr>
        </thead>

        <tbody>
          {sortedDecisions.length === 0 ? (
            <tr>
              <td colSpan="7">Sin decisiones registradas</td>
            </tr>
          ) : (
            sortedDecisions.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.phone_number}</td>
                <td>{formatDecision(item.decision)}</td>
                <td>{money(item.balance_before)}</td>
                <td>{money(item.cost)}</td>
                <td className="reason-cell">{item.reason}</td>
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