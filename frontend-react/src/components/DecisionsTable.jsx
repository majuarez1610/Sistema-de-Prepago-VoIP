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

export default function DecisionsTable({ decisions }) {
  const sorted = [...decisions].sort((a, b) => Number(a.id) - Number(b.id));

  return (
    <div className="table-shell">
      <table className="smart-table">
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
          {sorted.length === 0 ? (
            <tr>
              <td colSpan="7" className="empty-cell">
                No hay decisiones registradas.
              </td>
            </tr>
          ) : (
            sorted.map((decision) => (
              <tr key={decision.id}>
                <td className="id-cell">#{decision.id}</td>
                <td className="mono-cell">{decision.phone_number || '-'}</td>
                <td>{decisionBadge(decision.decision)}</td>
                <td className="money-cell">{money(decision.balance_before)}</td>
                <td className="money-cell">{money(decision.cost)}</td>
                <td className="reason-cell">{decision.reason || '-'}</td>
                <td className="date-cell">
                  {decision.created_at
                    ? new Date(decision.created_at).toLocaleString()
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