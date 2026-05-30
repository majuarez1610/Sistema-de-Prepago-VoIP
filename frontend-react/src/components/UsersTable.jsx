import React from 'react';

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function statusBadge(status) {
  if (status === 'active') return <span className="badge success">Activo</span>;
  if (status === 'inactive') return <span className="badge danger">Inactivo</span>;
  return <span className="badge neutral">{status || '-'}</span>;
}

export default function UsersTable({ users }) {
  const sorted = [...users].sort((a, b) => Number(a.id) - Number(b.id));

  return (
    <div className="table-shell">
      <table className="smart-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Abonado</th>
            <th>Número</th>
            <th>Saldo</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan="5" className="empty-cell">
                No hay usuarios para mostrar.
              </td>
            </tr>
          ) : (
            sorted.map((user) => (
              <tr key={user.id}>
                <td className="id-cell">#{user.id}</td>
                <td>
                  <div className="main-cell">{user.name || 'Sin nombre'}</div>
                  <span className="sub-cell">Usuario SDF</span>
                </td>
                <td className="mono-cell">{user.phone_number || '-'}</td>
                <td className="money-cell">{money(user.balance)}</td>
                <td>{statusBadge(user.status)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}