import React, { useEffect, useMemo, useState } from 'react';
import { api } from './services/api';

import BackendStatus from './components/BackendStatus';

import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Calls from './pages/Calls';
import Decisions from './pages/Decisions';
import Saturation from './pages/Saturation';
import RealCallGuide from './pages/RealCallGuide';

const VIEWS = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  CALLS: 'calls',
  DECISIONS: 'decisions',
  SATURATION: 'saturation',
  GUIDE: 'guide'
};

const NAV_ITEMS = [
  { key: VIEWS.DASHBOARD, label: 'Dashboard', icon: '📊' },
  { key: VIEWS.USERS, label: 'Usuarios', icon: '👥' },
  { key: VIEWS.CALLS, label: 'Llamadas', icon: '📞' },
  { key: VIEWS.DECISIONS, label: 'Decisiones', icon: '🧠' },
  { key: VIEWS.SATURATION, label: 'Saturación', icon: '🔥' },
  { key: VIEWS.GUIDE, label: 'Prueba real', icon: '🛰️' }
];

export default function App() {
  const [activeView, setActiveView] = useState(VIEWS.DASHBOARD);

  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState('');
  const [loadingHealth, setLoadingHealth] = useState(false);

  const [users, setUsers] = useState([]);
  const [calls, setCalls] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [scheduleAnalysis, setScheduleAnalysis] = useState(null);

  const [loadingData, setLoadingData] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('');

  const currentView = useMemo(
    () => NAV_ITEMS.find((item) => item.key === activeView),
    [activeView]
  );

  const loadHealth = async () => {
    setLoadingHealth(true);
    setHealthError('');

    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (error) {
      setHealthError(error.message);
    } finally {
      setLoadingHealth(false);
    }
  };

  const loadAll = async () => {
    setLoadingData(true);
    setGlobalMessage('');

    const [usersResult, callsResult, decisionsResult, scheduleResult] =
      await Promise.allSettled([
        api.getUsers(),
        api.getCalls(),
        api.getDecisions(),
        api.getScheduleAnalysis()
      ]);

    if (usersResult.status === 'fulfilled') {
      setUsers(Array.isArray(usersResult.value) ? usersResult.value : []);
    } else {
      console.error('[FRONTEND] Error usuarios:', usersResult.reason?.message);
      setGlobalMessage('No se pudieron cargar usuarios.');
    }

    if (callsResult.status === 'fulfilled') {
      setCalls(Array.isArray(callsResult.value) ? callsResult.value : []);
    } else {
      console.error('[FRONTEND] Error llamadas:', callsResult.reason?.message);
      setGlobalMessage('No se pudieron cargar llamadas.');
    }

    if (decisionsResult.status === 'fulfilled') {
      setDecisions(Array.isArray(decisionsResult.value) ? decisionsResult.value : []);
    } else {
      console.error('[FRONTEND] Error decisiones:', decisionsResult.reason?.message);
      setGlobalMessage('No se pudieron cargar decisiones.');
    }

    if (scheduleResult.status === 'fulfilled') {
      setScheduleAnalysis(scheduleResult.value || null);
    } else {
      console.error('[FRONTEND] Error saturación:', scheduleResult.reason?.message);
      setScheduleAnalysis(null);
    }

    setLoadingData(false);
  };

  const createUser = async (payload) => {
    await api.createUser(payload);
    await loadAll();
  };

  const rechargeUser = async (userId, amount) => {
    await api.rechargeUser(userId, amount);
    await loadAll();
  };

  const syncTwilioCalls = async () => {
    await api.syncTwilioCalls({ pageSize: 50 });
    await loadAll();
  };

  useEffect(() => {
    loadHealth();
    loadAll();
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar glass-card">
        <div className="brand">
          <div className="brand-logo">IN</div>

          <div>
            <h1>VoIP Intelligent Network</h1>
            <p>Prepago · Twilio · SCF · SDF</p>
          </div>
        </div>

        <nav className="nav-list">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`nav-button ${activeView === item.key ? 'active' : ''}`}
              onClick={() => setActiveView(item.key)}
            >
              <span>{item.icon}</span>
              <strong>{item.label}</strong>
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <span className="sidebar-label">Arquitectura</span>
          <p>
            Flujo tipo Red Inteligente: Twilio como SSP, Node.js como webhook,
            Python como SCF y MySQL como SDF.
          </p>
        </div>
      </aside>

      <section className="main-shell">
        <header className="topbar glass-card">
          <div>
            <p className="eyebrow">Panel de monitoreo</p>
            <h2>{currentView?.label || 'Dashboard'}</h2>
            <p>
              Control de abonados, llamadas, decisiones inteligentes, recargas
              y saturación por horario.
            </p>
          </div>

          <BackendStatus
            status={health}
            loading={loadingHealth}
            error={healthError}
            onRefresh={loadHealth}
          />
        </header>

        {globalMessage && (
          <div className="alert-card">
            <strong>Atención:</strong> {globalMessage}
          </div>
        )}

        <main className="content-card">
          {activeView === VIEWS.DASHBOARD && (
            <Dashboard
              users={users}
              calls={calls}
              decisions={decisions}
              analysis={scheduleAnalysis}
              loading={loadingData}
              onRefresh={loadAll}
            />
          )}

          {activeView === VIEWS.USERS && (
            <Users
              users={users}
              loading={loadingData}
              onRefresh={loadAll}
              onCreateUser={createUser}
              onRechargeUser={rechargeUser}
            />
          )}

          {activeView === VIEWS.CALLS && (
            <Calls
              calls={calls}
              loading={loadingData}
              onRefresh={loadAll}
              onSyncTwilio={syncTwilioCalls}
            />
          )}

          {activeView === VIEWS.DECISIONS && (
            <Decisions
              decisions={decisions}
              loading={loadingData}
              onRefresh={loadAll}
            />
          )}

          {activeView === VIEWS.SATURATION && (
            <Saturation
              analysis={scheduleAnalysis}
              loading={loadingData}
              onRefresh={loadAll}
            />
          )}

          {activeView === VIEWS.GUIDE && <RealCallGuide />}
        </main>
      </section>
    </div>
  );
}