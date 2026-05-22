import React, { useEffect, useState } from 'react';
import { api } from './services/api';
import BackendStatus from './components/BackendStatus';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Calls from './pages/Calls';
import Decisions from './pages/Decisions';
import RealCallGuide from './pages/RealCallGuide';

const VIEWS = {
  DASHBOARD: 'Dashboard',
  USERS: 'Users',
  CALLS: 'Calls',
  DECISIONS: 'Decisions',
  GUIDE: 'Prueba de llamada real'
};

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

  useEffect(() => {
    loadHealth();
    loadAll();
  }, []);

  return (
    <div className="app-shell">
      <header className="hero">
        <h1>Sistema de Prepago VoIP con Red Inteligente</h1>
        <p>Flujo principal: celular fisico a Twilio, despues ngrok, Node.js, Python, MySQL y respuesta TwiML.</p>
        <BackendStatus status={health} loading={loadingHealth} error={healthError} />
      </header>

      <nav className="nav-tabs">
        {Object.values(VIEWS).map((view) => (
          <button
            key={view}
            className={activeView === view ? 'active' : ''}
            onClick={() => setActiveView(view)}
          >
            {view}
          </button>
        ))}
      </nav>

      <main>
        {activeView === VIEWS.DASHBOARD && (
          <Dashboard usersCount={users.length} callsCount={calls.length} decisionsCount={decisions.length} />
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
          <Calls calls={calls} loading={loadingData} onRefresh={loadAll} />
        )}
        {activeView === VIEWS.DECISIONS && (
          <Decisions decisions={decisions} loading={loadingData} onRefresh={loadAll} />
        )}
        {activeView === VIEWS.GUIDE && <RealCallGuide />}
      </main>
    </div>
  );
}
