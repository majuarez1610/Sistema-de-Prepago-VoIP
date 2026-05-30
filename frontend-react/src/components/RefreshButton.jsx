import React from 'react';

export default function RefreshButton({
  onClick,
  label = 'Actualizar',
  disabled = false
}) {
  return (
    <button className="btn btn-primary" onClick={onClick} disabled={disabled}>
      <span className={disabled ? '' : 'spin-soft'}>↻</span>
      {label}
    </button>
  );
}