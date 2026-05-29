import React from 'react';

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatStatus(status) {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'active') {
    return <span className="badge success">Activo</span>;
  }

  if (normalized === 'inactive') {
    return <span className="badge danger">Inactivo</span>;
  }

  return <span className="badge neutral">{status || '-'}</span>;
}

export default function UsersTable({ users }) {
  const sortedUsers = [...users].sort(
    (a, b) => Number(a.id) - Number(b.id)
  );

  return (
    <div className="table-card">
      <div className="table-header">
        <div>
          <h3>Usuarios registrados</h3>
          <p>Abonados provisionados en la base de datos del sistema.</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Número E.164</th>
            <th>Saldo</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {sortedUsers.length === 0 ? (
            <tr>
              <td colSpan="5">Sin usuarios registrados</td>
            </tr>
          ) : (
            sortedUsers.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.phone_number}</td>
                <td>{money(item.balance)}</td>
                <td>{formatStatus(item.status)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}