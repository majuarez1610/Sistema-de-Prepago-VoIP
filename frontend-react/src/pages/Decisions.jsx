import React, { useMemo, useState } from 'react';
import DecisionsTable from '../components/DecisionsTable';
import RefreshButton from '../components/RefreshButton';

export default function Decisions({ decisions, loading, onRefresh }) {
  const [search, setSearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('ALL');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return decisions.filter((item) => {
      const matchSearch =
        !term ||
        String(item.id || '').includes(term) ||
        String(item.phone_number || '').toLowerCase().includes(term) ||
        String(item.reason || '').toLowerCase().includes(term);

      const matchDecision =
        decisionFilter === 'ALL' || item.decision === decisionFilter;

      return matchSearch && matchDecision;
    });
  }, [decisions, search, decisionFilter]);

  const allow = decisions.filter((item) => item.decision === 'ALLOW_CALL').length;
  const reject = decisions.filter((item) => item.decision === 'REJECT_CALL').length;

  return (
    <div className="view-stack animate-page">
      <div className="view-header">
        <div>
          <p className="eyebrow">SCF</p>
          <h2>Decisiones inteligentes</h2>
          <p>Bitácora del servicio inteligente con saldo, costo y motivo.</p>
        </div>

        <RefreshButton onClick={onRefresh} disabled={loading} />
      </div>

      <section className="stats-grid compact">
        <article className="stat-card">
          <span>Total</span>
          <strong>{decisions.length}</strong>
          <p>Decisiones registradas</p>
        </article>

        <article className="stat-card">
          <span>Autorizadas</span>
          <strong>{allow}</strong>
          <p>ALLOW_CALL</p>
        </article>

        <article className="stat-card">
          <span>Rechazadas</span>
          <strong>{reject}</strong>
          <p>REJECT_CALL</p>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-title">
          <div>
            <h3>Bitácora del SCF</h3>
            <p>{filtered.length} de {decisions.length} decisiones visibles</p>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-input">
            <span>🔎</span>
            <input
              placeholder="Buscar por número, ID o motivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
          >
            <option value="ALL">Todas</option>
            <option value="ALLOW_CALL">Autorizadas</option>
            <option value="REJECT_CALL">Rechazadas</option>
          </select>

          <button
            className="btn btn-ghost"
            onClick={() => {
              setSearch('');
              setDecisionFilter('ALL');
            }}
          >
            Limpiar
          </button>
        </div>

        <DecisionsTable decisions={filtered} />
      </section>
    </div>
  );
}