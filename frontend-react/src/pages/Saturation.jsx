import React, { useMemo, useState } from 'react';
import RefreshButton from '../components/RefreshButton';

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function percent(value, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((Number(value || 0) / Number(total || 1)) * 100));
}

function badge(classification) {
  const map = {
    SATURADO: ['danger', 'Saturado'],
    NORMAL: ['success', 'Normal'],
    SIN_TRAFICO: ['neutral', 'Sin tráfico'],
    TARIFA_PICO: ['warning', 'Tarifa pico'],
    AUTORIZADA: ['success', 'Autorizada'],
    RECHAZADA: ['danger', 'Rechazada'],
    RECHAZADA_SALDO: ['danger', 'Saldo insuficiente'],
    RECHAZADA_USUARIO: ['danger', 'Usuario no registrado'],
    RECHAZADA_TARIFA_PICO: ['warning', 'Tarifa no aceptada'],
    SIN_CLASIFICAR: ['neutral', 'Sin clasificar']
  };

  const [type, label] = map[classification] || ['neutral', classification || '-'];
  return <span className={`badge ${type}`}>{label}</span>;
}

function blockIcon(key) {
  const icons = {
    madrugada: '🌙',
    manana: '🌤️',
    tarde: '☀️',
    noche: '🌃'
  };

  return icons[key] || '🕒';
}

export default function Saturation({ analysis, loading, onRefresh }) {
  const [tab, setTab] = useState('blocks');
  const [selectedBlock, setSelectedBlock] = useState('ALL');
  const [search, setSearch] = useState('');

  const blocks = analysis?.blocks || [];
  const hours = analysis?.hours || [];
  const calls = analysis?.current_hour_calls || [];
  const threshold = Number(analysis?.saturation_threshold || 1);

  const filteredHours = useMemo(() => {
    if (selectedBlock === 'ALL') return hours;
    return hours.filter((hour) => hour.block_key === selectedBlock);
  }, [hours, selectedBlock]);

  const filteredCalls = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return calls;

    return calls.filter((call) => {
      return (
        String(call.id || '').includes(term) ||
        String(call.from_number || '').toLowerCase().includes(term) ||
        String(call.to_number || '').toLowerCase().includes(term) ||
        String(call.reason || '').toLowerCase().includes(term) ||
        String(call.classification || '').toLowerCase().includes(term)
      );
    });
  }, [calls, search]);

  const saturatedBlocks = blocks.filter((block) => block.is_saturated).length;

  return (
    <div className="view-stack animate-page">
      <div className="view-header">
        <div>
          <p className="eyebrow">Tráfico</p>
          <h2>Análisis de saturación</h2>
          <p>Clasificación dinámica por bloque horario y hora actual.</p>
        </div>

        <RefreshButton onClick={onRefresh} disabled={loading} />
      </div>

      <section className="saturation-hero">
        <div>
          <span className="hero-kicker">Bloque actual</span>
          <h3>{analysis?.current_block?.label || 'Sin datos'}</h3>
          <p>
            Hora del servidor: <strong>{analysis?.current_hour_label || '-'}</strong>.
            Umbral de saturación: <strong>{threshold}</strong> llamada(s).
          </p>

          <div className="hero-actions">
            {badge(analysis?.current_block?.classification)}
            {analysis?.current_block?.is_peak && (
              <span className="badge warning">Mayor tráfico</span>
            )}
          </div>
        </div>

        <div className={`saturation-orb ${analysis?.current_block?.is_saturated ? 'hot' : 'safe'}`}>
          <span>{analysis?.current_block?.is_saturated ? 'PICO' : 'OK'}</span>
        </div>
      </section>

      <section className="stats-grid compact">
        <article className="stat-card">
          <span>Llamadas</span>
          <strong>{analysis?.totals?.calls || 0}</strong>
          <p>Total histórico</p>
        </article>

        <article className="stat-card">
          <span>Autorizadas</span>
          <strong>{analysis?.totals?.authorized || 0}</strong>
          <p>ALLOW_CALL</p>
        </article>

        <article className="stat-card">
          <span>Rechazadas</span>
          <strong>{analysis?.totals?.rejected || 0}</strong>
          <p>REJECT_CALL</p>
        </article>

        <article className="stat-card">
          <span>Saturados</span>
          <strong>{saturatedBlocks}</strong>
          <p>Bloques en pico</p>
        </article>
      </section>

      <div className="tabs-card">
        <button className={tab === 'blocks' ? 'active' : ''} onClick={() => setTab('blocks')}>
          🧭 Bloques
        </button>

        <button className={tab === 'hours' ? 'active' : ''} onClick={() => setTab('hours')}>
          ⏱️ Horas
        </button>

        <button className={tab === 'calls' ? 'active' : ''} onClick={() => setTab('calls')}>
          📞 Hora actual
        </button>
      </div>

      {tab === 'blocks' && (
        <section className="block-grid">
          {blocks.map((block) => {
            const progress = percent(block.total, threshold);

            return (
              <article
                key={block.key}
                className={`block-card ${block.is_saturated ? 'hot' : ''} ${block.is_current ? 'current' : ''}`}
              >
                <div className="block-top">
                  <div className="block-icon">{blockIcon(block.key)}</div>
                  <div>
                    <h3>{block.label}</h3>
                    <p>{block.hours_range}</p>
                  </div>
                </div>

                <div className="block-badges">
                  {badge(block.classification)}
                  {block.is_current && <span className="badge info">Actual</span>}
                  {block.is_peak && <span className="badge warning">Pico</span>}
                </div>

                <div className="progress-row">
                  <div>
                    <span>Saturación</span>
                    <strong>{progress}%</strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className={`progress-fill ${block.is_saturated ? 'danger' : 'success'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="block-stats">
                  <div>
                    <span>Total</span>
                    <strong>{block.total}</strong>
                  </div>

                  <div>
                    <span>OK</span>
                    <strong>{block.authorized}</strong>
                  </div>

                  <div>
                    <span>Rech.</span>
                    <strong>{block.rejected}</strong>
                  </div>

                  <div>
                    <span>Costo</span>
                    <strong>{money(block.total_cost)}</strong>
                  </div>
                </div>

                <button
                  className="btn btn-ghost full"
                  onClick={() => {
                    setSelectedBlock(block.key);
                    setTab('hours');
                  }}
                >
                  Ver horas
                </button>
              </article>
            );
          })}
        </section>
      )}

      {tab === 'hours' && (
        <section className="panel-card">
          <div className="filter-bar">
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
            >
              <option value="ALL">Todas las horas</option>
              {blocks.map((block) => (
                <option key={block.key} value={block.key}>
                  {block.label}
                </option>
              ))}
            </select>
          </div>

          <div className="hour-grid">
            {filteredHours.map((hour) => {
              const progress = percent(hour.total, threshold);

              return (
                <article
                  key={hour.hour}
                  className={`hour-card ${hour.is_current ? 'current' : ''} ${hour.is_saturated ? 'hot' : ''}`}
                >
                  <div className="hour-title">
                    <strong>{hour.label}</strong>
                    {hour.is_current && <span className="badge info">Actual</span>}
                  </div>

                  <p>{hour.block_label}</p>
                  {badge(hour.classification)}

                  <div className="progress-track">
                    <div
                      className={`progress-fill ${hour.is_saturated ? 'danger' : 'info'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="hour-mini">
                    <span>Total: <strong>{hour.total}</strong></span>
                    <span>OK: <strong>{hour.authorized}</strong></span>
                    <span>Rech: <strong>{hour.rejected}</strong></span>
                    <span>Costo: <strong>{money(hour.total_cost)}</strong></span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'calls' && (
        <section className="panel-card">
          <div className="panel-title">
            <div>
              <h3>Llamadas de la hora actual</h3>
              <p>{filteredCalls.length} de {calls.length} llamadas visibles</p>
            </div>
          </div>

          <div className="filter-bar">
            <div className="search-input">
              <span>🔎</span>
              <input
                placeholder="Buscar por número, motivo o ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="btn btn-ghost" onClick={() => setSearch('')}>
              Limpiar
            </button>
          </div>

          <div className="call-card-grid">
            {filteredCalls.length === 0 ? (
              <div className="empty-box">No hay llamadas en la hora actual.</div>
            ) : (
              filteredCalls.map((call) => (
                <article className="mini-call-card" key={call.id}>
                  <div>
                    <span className="sub-cell">ID #{call.id}</span>
                    <h3>{call.from_number}</h3>
                    <p>Destino: {call.to_number || '-'}</p>
                  </div>

                  <div className="mini-call-meta">
                    {badge(call.classification)}
                    <strong>{money(call.cost)}</strong>
                  </div>

                  <p className="mini-reason">{call.reason || '-'}</p>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}