export default function BackendStatus({ status, loading, error }) {
  if (loading) {
    return <div className="status-badge status-loading">Verificando backend...</div>;
  }

  if (error) {
    return <div className="status-badge status-error">Backend no disponible</div>;
  }

  const mysqlState = status?.status?.mysql || 'desconocido';
  const pythonState = status?.status?.python || 'desconocido';

  return (
    <div className="status-wrapper">
      <div className="status-badge status-ok">Backend Node: activo</div>
      <div className="status-badge status-sub">MySQL: {mysqlState}</div>
      <div className="status-badge status-sub">Python: {pythonState}</div>
    </div>
  );
}
