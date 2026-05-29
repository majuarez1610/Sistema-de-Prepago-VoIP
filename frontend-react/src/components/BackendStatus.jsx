import React from 'react';

function getStateClass(value) {
  const normalized = String(value || '').toLowerCase();

  if (
    normalized.includes('connected') ||
    normalized.includes('ok') ||
    normalized.includes('activo') ||
    normalized.includes('up')
  ) {
    return 'ok';
  }

  if (
    normalized.includes('down') ||
    normalized.includes('error') ||
    normalized.includes('desconectado') ||
    normalized.includes('fall')
  ) {
    return 'error';
  }

  return 'neutral';
}

export default function BackendStatus({ status, loading, error }) {
  if (loading) {
    return (
      <div className="status-grid">
        <div className="status-card neutral">
          <span className="dot"></span>
          <div>
            <strong>Estado del sistema</strong>
            <p>Verificando servicios...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-grid">
        <div className="status-card error">
          <span className="dot"></span>
          <div>
            <strong>Backend</strong>
            <p>No disponible</p>
          </div>
        </div>
      </div>
    );
  }

  const mysqlState = status?.status?.mysql || 'desconocido';
  const pythonState = status?.status?.python || 'desconocido';

  return (
    <div className="status-grid">
      <div className="status-card ok">
        <span className="dot"></span>
        <div>
          <strong>Node.js</strong>
          <p>Activo</p>
        </div>
      </div>

      <div className={`status-card ${getStateClass(mysqlState)}`}>
        <span className="dot"></span>
        <div>
          <strong>MySQL</strong>
          <p>{mysqlState}</p>
        </div>
      </div>

      <div className={`status-card ${getStateClass(pythonState)}`}>
        <span className="dot"></span>
        <div>
          <strong>Python / SCF</strong>
          <p>{pythonState}</p>
        </div>
      </div>
    </div>
  );
}