import React, { useMemo, useState } from 'react';
import CallsTable from '../components/CallsTable';
import RefreshButton from '../components/RefreshButton';

export default function Calls({ calls, loading, onRefresh, onSyncTwilio }) {
  const [search, setSearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [message, setMessage] = useState('');

  const filteredCalls = useMemo(() => {
    const term = search.trim().toLowerCase();

    return calls.filter((call) => {
      const matchSearch =
        !term ||
        String(call.id || '').includes(term) ||
        String(call.from_number || '').toLowerCase().includes(term) ||
        String(call.to_number || '').toLowerCase().includes(term) ||
        String(call.reason || '').toLowerCase().includes(term) ||
        String(call.twilio_call_sid || '').toLowerCase().includes(term);

      const matchDecision =
        decisionFilter === 'ALL' || call.decision === decisionFilter;

      const matchStatus =
        statusFilter === 'ALL' || call.call_status === statusFilter;

      return matchSearch && matchDecision && matchStatus;
    });
  }, [calls, search, decisionFilter, statusFilter]);

  const authorized = calls.filter((call) => call.decision === 'ALLOW_CALL').length;
  const rejected = calls.filter((call) => call.decision === 'REJECT_CALL').length;
  const completed = calls.filter((call) => call.call_status === 'completed').length;

  const handleSync = async () => {
    setMessage('Sincronizando eventos desde Twilio...');

    try {
      await onSyncTwilio();
      setMessage('Sincronización completada.');
    } catch (error) {
      setMessage(`Error al sincronizar: ${error.message}`);
    }
  };

  return (
    <div className="view-stack animate-page">
      <div className="view-header">
        <div>
          <p className="eyebrow">Eventos</p>
          <h2>Monitoreo de llamadas</h2>
          <p>Historial de llamadas, control de admisión y eventos Twilio.</p>
        </div>

        <div className="header-actions">
          <RefreshButton onClick={onRefresh} disabled={loading} />
          <button className="btn btn-secondary" onClick={handleSync} disabled={loading}>
            Sincronizar Twilio
          </button>
        </div>
      </div>

      <section className="stats-grid compact">
        <article className="stat-card">
          <span>Total</span>
          <strong>{calls.length}</strong>
          <p>Eventos registrados</p>
        </article>

        <article className="stat-card">
          <span>Autorizadas</span>
          <strong>{authorized}</strong>
          <p>ALLOW_CALL</p>
        </article>

        <article className="stat-card">
          <span>Rechazadas</span>
          <strong>{rejected}</strong>
          <p>REJECT_CALL</p>
        </article>

        <article className="stat-card">
          <span>Completadas</span>
          <strong>{completed}</strong>
          <p>Twilio completed</p>
        </article>
      </section>

      {message && <div className="alert-card">{message}</div>}

      <section className="panel-card">
        <div className="panel-title">
          <div>
            <h3>Registro de llamadas</h3>
            <p>{filteredCalls.length} de {calls.length} eventos visibles</p>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-input">
            <span>🔎</span>
            <input
              placeholder="Buscar por número, motivo, SID o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
          >
            <option value="ALL">Todas las decisiones</option>
            <option value="ALLOW_CALL">Autorizadas</option>
            <option value="REJECT_CALL">Rechazadas</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos los estados</option>
            <option value="completed">Completadas</option>
            <option value="failed">Fallidas</option>
            <option value="ringing">Timbrando</option>
            <option value="queued">En cola</option>
            <option value="initiated">Iniciadas</option>
            <option value="in-progress">En curso</option>
            <option value="busy">Ocupado</option>
            <option value="no-answer">Sin respuesta</option>
            <option value="canceled">Canceladas</option>
          </select>

          <button
            className="btn btn-ghost"
            onClick={() => {
              setSearch('');
              setDecisionFilter('ALL');
              setStatusFilter('ALL');
            }}
          >
            Limpiar
          </button>
        </div>

        <CallsTable calls={filteredCalls} />
      </section>
    </div>
  );
}