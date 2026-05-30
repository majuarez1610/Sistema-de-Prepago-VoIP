import React, { useMemo, useState } from 'react';
import UsersTable from '../components/UsersTable';
import RefreshButton from '../components/RefreshButton';

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function Users({
  users,
  loading,
  onRefresh,
  onCreateUser,
  onRechargeUser
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone_number: '',
    balance: '10.00',
    status: 'active'
  });

  const [recharge, setRecharge] = useState({
    userId: '',
    amount: '5.00'
  });

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchSearch =
        !term ||
        String(user.id || '').includes(term) ||
        String(user.name || '').toLowerCase().includes(term) ||
        String(user.phone_number || '').toLowerCase().includes(term);

      const matchStatus =
        statusFilter === 'ALL' || user.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [users, search, statusFilter]);

  const activeUsers = users.filter((user) => user.status === 'active').length;
  const inactiveUsers = users.filter((user) => user.status === 'inactive').length;
  const totalBalance = users.reduce((acc, user) => acc + Number(user.balance || 0), 0);

  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage('Creando usuario...');

    try {
      await onCreateUser({
        name: form.name,
        phone_number: form.phone_number,
        balance: Number(form.balance),
        status: form.status
      });

      setForm({
        name: '',
        phone_number: '',
        balance: '10.00',
        status: 'active'
      });

      setMessage('Usuario creado correctamente.');
    } catch (error) {
      setMessage(`Error al crear usuario: ${error.message}`);
    }
  };

  const handleRecharge = async (event) => {
    event.preventDefault();
    setMessage('Aplicando recarga...');

    try {
      await onRechargeUser(recharge.userId, Number(recharge.amount));
      setRecharge({ userId: '', amount: '5.00' });
      setMessage('Recarga aplicada correctamente.');
    } catch (error) {
      setMessage(`Error al recargar: ${error.message}`);
    }
  };

  return (
    <div className="view-stack animate-page">
      <div className="view-header">
        <div>
          <p className="eyebrow">SDF</p>
          <h2>Gestión de usuarios</h2>
          <p>Alta de abonados, estado del servicio y recarga manual de saldo.</p>
        </div>

        <RefreshButton onClick={onRefresh} disabled={loading} />
      </div>

      <section className="stats-grid compact">
        <article className="stat-card">
          <span>Total</span>
          <strong>{users.length}</strong>
          <p>Usuarios registrados</p>
        </article>

        <article className="stat-card">
          <span>Activos</span>
          <strong>{activeUsers}</strong>
          <p>Servicio habilitado</p>
        </article>

        <article className="stat-card">
          <span>Inactivos</span>
          <strong>{inactiveUsers}</strong>
          <p>Servicio bloqueado</p>
        </article>

        <article className="stat-card">
          <span>Saldo total</span>
          <strong>{money(totalBalance)}</strong>
          <p>Bolsa acumulada</p>
        </article>
      </section>

      <section className="form-grid">
        <form className="panel-card form-panel" onSubmit={handleCreate}>
          <div className="panel-title">
            <h3>Crear abonado</h3>
            <span>Alta en SDF</span>
          </div>

          <label>
            Nombre
            <input
              value={form.name}
              placeholder="Ej. Carlos"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>

          <label>
            Número E.164
            <input
              value={form.phone_number}
              placeholder="+52XXXXXXXXXX"
              onChange={(e) =>
                setForm({ ...form, phone_number: e.target.value })
              }
              required
            />
          </label>

          <label>
            Saldo inicial
            <input
              type="number"
              step="0.01"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              required
            />
          </label>

          <label>
            Estado
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </label>

          <button className="btn btn-primary" type="submit">
            Guardar usuario
          </button>
        </form>

        <form className="panel-card form-panel" onSubmit={handleRecharge}>
          <div className="panel-title">
            <h3>Recargar saldo</h3>
            <span>Recarga manual</span>
          </div>

          <label>
            ID de usuario
            <input
              value={recharge.userId}
              placeholder="Ej. 1"
              onChange={(e) =>
                setRecharge({ ...recharge, userId: e.target.value })
              }
              required
            />
          </label>

          <label>
            Monto
            <input
              type="number"
              step="0.01"
              value={recharge.amount}
              onChange={(e) =>
                setRecharge({ ...recharge, amount: e.target.value })
              }
              required
            />
          </label>

          <button className="btn btn-secondary" type="submit">
            Aplicar recarga
          </button>

          <div className="hint-box">
            También existe recarga simulada por llamada con DTMF.
          </div>
        </form>
      </section>

      {message && <div className="alert-card">{message}</div>}

      <section className="panel-card">
        <div className="panel-title">
          <div>
            <h3>Tabla de usuarios</h3>
            <p>{filteredUsers.length} de {users.length} usuarios visibles</p>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-input">
            <span>🔎</span>
            <input
              placeholder="Buscar por ID, nombre o número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          <button
            className="btn btn-ghost"
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
            }}
          >
            Limpiar
          </button>
        </div>

        <UsersTable users={filteredUsers} />
      </section>
    </div>
  );
}