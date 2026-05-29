import React from 'react';
import DecisionsTable from '../components/DecisionsTable';
import RefreshButton from '../components/RefreshButton';

export default function Decisions({ decisions, loading, onRefresh }) {
  const [search, setSearch] = React.useState('');
  const [decisionFilter, setDecisionFilter] = React.useState('ALL');

  const filteredDecisions = React.useMemo(() => {
    const term = search.toLowerCase().trim();

    return decisions.filter((item) => {
      const matchesSearch =
        !term ||
        String(item.phone_number || '').toLowerCase().includes(term) ||
        String(item.reason || '').toLowerCase().includes(term) ||
        String(item.id || '').includes(term);

      const matchesDecision =
        decisionFilter === 'ALL' || item.decision === decisionFilter;

      return matchesSearch && matchesDecision;
    });
  }, [decisions, search, decisionFilter]);

  const allowCount = decisions.filter(
    (item) => item.decision === 'ALLOW_CALL'
  ).length;

  const rejectCount = decisions.filter(
    (item) => item.decision === 'REJECT_CALL'
  ).length;

  return (
    <div className="page-stack animate-in">
      <div className="section-toolbar">
        <div>
          <h3>Decisiones del SCF</h3>
          <p>Bitácora de autorización, denegación y motivos técnicos.</p>
        </div>

        <RefreshButton onClick={onRefresh} disabled={loading} />
      </div>

      <div className="mini-metrics-grid three">
        <div className="mini-metric-card">
          <span>Total de decisiones</span>
          <strong>{decisions.length}</strong>
        </div>
        <div className="mini-metric-card">
          <span>Autorizaciones</span>
          <strong>{allowCount}</strong>
        </div>
        <div className="mini-metric-card">
          <span>Denegaciones</span>
          <strong>{rejectCount}</strong>
        </div>
      </div>

      <div className="filter-card">
        <div className="search-box">
          <span>🔎</span>
          <input
            placeholder="Buscar por abonado, motivo o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={decisionFilter} onChange={(e) => setDecisionFilter(e.target.value)}>
          <option value="ALL">Todas las decisiones</option>
          <option value="ALLOW_CALL">Servicio autorizado</option>
          <option value="REJECT_CALL">Servicio denegado</option>
        </select>

        <button
          className="btn-ghost"
          onClick={() => {
            setSearch('');
            setDecisionFilter('ALL');
          }}
        >
          Limpiar filtros
        </button>
      </div>

      <div className="result-counter">
        Mostrando <strong>{filteredDecisions.length}</strong> de <strong>{decisions.length}</strong> decisiones.
      </div>

      <DecisionsTable decisions={filteredDecisions} />
    </div>
  );
}