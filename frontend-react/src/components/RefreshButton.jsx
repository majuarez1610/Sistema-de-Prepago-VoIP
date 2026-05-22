import React from 'react';
export default function RefreshButton({ onClick, label = 'Actualizar', disabled = false }) {
  return (
    <button className="btn-refresh" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

