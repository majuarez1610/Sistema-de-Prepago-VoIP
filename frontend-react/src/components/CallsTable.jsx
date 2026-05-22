import React from 'react';
export default function CallsTable({ calls }) {
  return (
    <div className="table-card">
      <h3>Llamadas</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>from_number</th>
            <th>to_number</th>
            <th>twilio_call_sid</th>
            <th>decision</th>
            <th>reason</th>
            <th>created_at</th>
          </tr>
        </thead>
        <tbody>
          {calls.length === 0 ? (
            <tr>
              <td colSpan="7">Sin datos</td>
            </tr>
          ) : (
            calls.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.from_number}</td>
                <td>{item.to_number}</td>
                <td>{item.twilio_call_sid}</td>
                <td>{item.decision}</td>
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

