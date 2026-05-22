import React from 'react';
function money(value) {
  return Number(value).toFixed(2);
}

export default function UsersTable({ users }) {
  return (
    <div className="table-card">
      <h3>Usuarios</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>phone_number</th>
            <th>balance</th>
            <th>status</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="5">Sin datos</td>
            </tr>
          ) : (
            users.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.phone_number}</td>
                <td>{money(item.balance)}</td>
                <td>{item.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

