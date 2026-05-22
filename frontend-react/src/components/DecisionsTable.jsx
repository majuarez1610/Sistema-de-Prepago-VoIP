import React from 'react';
export default function DecisionsTable({ decisions }) {
  return (
    <div className="table-card">
      <h3>Decisiones</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>phone_number</th>
            <th>decision</th>
            <th>balance_before</th>
            <th>cost</th>
            <th>reason</th>
            <th>created_at</th>
          </tr>
        </thead>
        <tbody>
          {decisions.length === 0 ? (
            <tr>
              <td colSpan="7">Sin datos</td>
            </tr>
          ) : (
            decisions.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.phone_number}</td>
                <td>{item.decision}</td>
                <td>{Number(item.balance_before).toFixed(2)}</td>
                <td>{Number(item.cost).toFixed(2)}</td>
                <td>{item.reason}</td>
                <td>{new Date(item.created_at).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

