import React from 'react';
import CallsTable from '../components/CallsTable';
import RefreshButton from '../components/RefreshButton';

export default function Calls({ calls, loading, onRefresh, onSyncTwilio }) {
  const [message, setMessage] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [decisionFilter, setDecisionFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  const filteredCalls = React.useMemo(() => {
    const term = search.toLowerCase().trim();

    return calls.filter((item) => {
      const matchesSearch =
        !term ||
        String(item.from_number || '').toLowerCase().includes(term) ||
        String(item.to_number || '').toLowerCase().includes(term) ||
        String(item.twilio_call_sid || '').toLowerCase().includes(term) ||
        String(item.reason || '').toLowerCase().includes(term);

      const matchesDecision =
        decisionFilter === 'ALL' || item.decision === decisionFilter;

      const matchesStatus =
        statusFilter === 'ALL' || item.call_status === statusFilter;

      return matchesSearch && matchesDecision && matchesStatus;
    });
  }, [calls, search, decisionFilter, statusFilter]);

  const authorized = calls.filter((item) => item.decision === 'ALLOW_CALL').length;
  const rejected = calls.filter((item) => item.decision === 'REJECT_CALL').length;
  const completed = calls.filter((item) => item.call_status === 'completed').length;
  const failed = calls.filter((item) => item.call_status === 'failed').length;

  const handleSyncTwilio = async () => {
    setMessage('Sincronizando eventos desde Twilio...');
    try {
      await onSyncTwilio();
      setMessage('Eventos de señalización sincronizados correctamente.');
    } catch (error) {
      setMessage(`Error al sincronizar Twilio: ${error.message}`);
    }
  };

  return (
    <div className="page-stack animate-in">
      <div className="section-toolbar">
        <div>
          <h3>Monitoreo de llamadas</h3>
          <p>Eventos de señalización, decisiones SCF y liberación de sesiones.</p>
        </div>

        <div className="toolbar-actions">
          <RefreshButton onClick={onRefresh} disabled={loading} />
          <button className="btn-secondary" onClick={handleSyncTwilio} disabled={loading}>
            ⭮ Sincronizar Twilio
          </button>
        </div>
      </div>

      <div className="mini-metrics-grid">
        <div className="mini-metric-card">
          <span>Total</span>
          <strong>{calls.length}</strong>
        </div>
        <div className="mini-metric-card">
          <span>Autorizadas</span>
          <strong>{authorized}</strong>
        </div>
        <div className="mini-metric-card">
          <span>Denegadas</span>
          <strong>{rejected}</strong>
        </div>
        <div className="mini-metric-card">
          <span>Completadas</span>
          <strong>{completed}</strong>
        </div>
        <div className="mini-metric-card">
          <span>Fallidas</span>
          <strong>{failed}</strong>
        </div>
      </div>

      <div className="filter-card">
        <div className="search-box">
          <span>🔎</span>
          <input
            placeholder="Buscar por origen, destino, SID o motivo técnico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={decisionFilter} onChange={(e) => setDecisionFilter(e.target.value)}>
          <option value="ALL">Todas las decisiones</option>
          <option value="ALLOW_CALL">Servicio autorizado</option>
          <option value="REJECT_CALL">Servicio denegado</option>
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">Todos los estados</option>
          <option value="completed">Sesión establecida</option>
          <option value="failed">Liberación / fallo</option>
          <option value="busy">Destino ocupado</option>
          <option value="no-answer">Sin respuesta</option>
          <option value="canceled">Cancelada</option>
        </select>

        <button
          className="btn-ghost"
          onClick={() => {
            setSearch('');
            setDecisionFilter('ALL');
            setStatusFilter('ALL');
          }}
        >
          Limpiar filtros
        </button>
      </div>

      <div className="result-counter">
        Mostrando <strong>{filteredCalls.length}</strong> de <strong>{calls.length}</strong> eventos.
      </div>

      {message && <p className="message-line">{message}</p>}

      <CallsTable calls={filteredCalls} />
    </div>
  );
}