import React from 'react';

function getStatusClass(value) {
  const text = String(value || '').toLowerCase();

  if (
    text.includes('ok') ||
    text.includes('up') ||
    text.includes('connected') ||
    text.includes('activo')
  ) {
    return 'ok';
  }

  if (
    text.includes('error') ||
    text.includes('down') ||
    text.includes('fall') ||
    text.includes('desconectado')
  ) {
    return 'bad';
  }

  return 'neutral';
}

export default function BackendStatus({ status, loading, error, onRefresh }) {
  if (loading) {
    return (
      <div className="service-status">
        <div className="service-pill neutral">
          <span className="pulse-dot"></span>
          Verificando...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="service-status">
        <button className="service-pill bad" onClick={onRefresh}>
          <span className="pulse-dot"></span>
          Backend no disponible
        </button>
      </div>
    );
  }

  const mysqlState = status?.status?.mysql || 'desconocido';
  const pythonState = status?.status?.python || 'desconocido';

  return (
    <div className="service-status">
      <div className="service-pill ok">
        <span className="pulse-dot"></span>
        Node.js
      </div>

      <div className={`service-pill ${getStatusClass(mysqlState)}`}>
        <span className="pulse-dot"></span>
        MySQL
      </div>

      <div className={`service-pill ${getStatusClass(pythonState)}`}>
        <span className="pulse-dot"></span>
        Python / SCF
      </div>
    </div>
  );
}