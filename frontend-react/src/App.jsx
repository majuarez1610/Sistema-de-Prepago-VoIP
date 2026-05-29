import React, { useEffect, useState } from 'react';
import { api } from './services/api';
import BackendStatus from './components/BackendStatus';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Calls from './pages/Calls';
import Decisions from './pages/Decisions';
import RealCallGuide from './pages/RealCallGuide';

const VIEWS = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  CALLS: 'calls',
  DECISIONS: 'decisions',
  GUIDE: 'guide'
};

const NAV_ITEMS = [
  { key: VIEWS.DASHBOARD, label: 'Dashboard', icon: '📊' },
  { key: VIEWS.USERS, label: 'Usuarios', icon: '👤' },
  { key: VIEWS.CALLS, label: 'Llamadas', icon: '📞' },
  { key: VIEWS.DECISIONS, label: 'Decisiones', icon: '🧠' },
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
  const [loadingData, setLoadingData] = useState(false);

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
    try {
      const [usersData, callsData, decisionsData] = await Promise.all([
        api.getUsers(),
        api.getCalls(),
        api.getDecisions()
      ]);
      setUsers(usersData);
      setCalls(callsData);
      setDecisions(decisionsData);
    } finally {
      setLoadingData(false);
    }
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

  const currentViewLabel =
    NAV_ITEMS.find((item) => item.key === activeView)?.label || 'Dashboard';

  return (
    <div className="app-shell">
      <div className="layout-shell">
        <aside className="sidebar">
          <div className="brand-card">
            <div className="brand-badge">IN</div>
            <div>
              <h1>VoIP Intelligent Network</h1>
              <p>Sistema de prepago y control inteligente de llamadas</p>
            </div>
          </div>

          <nav className="side-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                className={`nav-item ${activeView === item.key ? 'active' : ''}`}
                onClick={() => setActiveView(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="side-note">
            <h3>Resumen del proyecto</h3>
            <p>
              Simulación de Red Inteligente con Twilio, Node.js, Python y MySQL
              para autorización, rechazo y monitoreo de llamadas.
            </p>
          </div>
        </aside>

        <div className="content-shell">
          <header className="topbar">
            <div>
              <p className="eyebrow">Panel principal</p>
              <h2>{currentViewLabel}</h2>
              <p className="topbar-subtitle">
                Interfaz de monitoreo para eventos de señalización, usuarios y
                decisiones del SCF.
              </p>
            </div>

            <BackendStatus
              status={health}
              loading={loadingHealth}
              error={healthError}
            />
          </header>

          <main className="content-panel">
            {activeView === VIEWS.DASHBOARD && (
              <Dashboard users={users} calls={calls} decisions={decisions} />
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

            {activeView === VIEWS.GUIDE && <RealCallGuide />}
          </main>
        </div>
      </div>
    </div>
  );
}