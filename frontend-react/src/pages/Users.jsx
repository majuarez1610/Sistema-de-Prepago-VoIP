import React, { useState } from 'react';
import UsersTable from '../components/UsersTable';
import RefreshButton from '../components/RefreshButton';

export default function Users({
  users,
  loading,
  onRefresh,
  onCreateUser,
  onRechargeUser
}) {
  const [form, setForm] = useState({
    name: '',
    phone_number: '',
    balance: '10.00',
    status: 'active'
  });

  const [recharge, setRecharge] = useState({
    userId: '',
    amount: '1.00'
  });

  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredUsers = React.useMemo(() => {
    const term = search.toLowerCase().trim();

    return users.filter((item) => {
      const matchesSearch =
        !term ||
        String(item.name || '').toLowerCase().includes(term) ||
        String(item.phone_number || '').toLowerCase().includes(term) ||
        String(item.id || '').includes(term);

      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const activeUsers = users.filter((item) => item.status === 'active').length;
  const inactiveUsers = users.filter((item) => item.status === 'inactive').length;

  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage('Procesando alta de usuario...');
    try {
      await onCreateUser({
        name: form.name,
        phone_number: form.phone_number,
        balance: Number(form.balance),
        status: form.status
      });

      setMessage('Usuario creado correctamente.');
      setForm({
        name: '',
        phone_number: '',
        balance: '10.00',
        status: 'active'
      });
    } catch (error) {
      setMessage(`Error al crear usuario: ${error.message}`);
    }
  };

  const handleRecharge = async (event) => {
    event.preventDefault();
    setMessage('Aplicando recarga...');
    try {
      await onRechargeUser(recharge.userId, Number(recharge.amount));
      setMessage('Recarga aplicada correctamente.');
      setRecharge({ userId: '', amount: '1.00' });
    } catch (error) {
      setMessage(`Error en recarga: ${error.message}`);
    }
  };

  return (
    <div className="page-stack animate-in">
      <div className="section-toolbar">
        <div>
          <h3>Gestión de abonados</h3>
          <p>Alta, estado, saldo y búsqueda de usuarios provisionados en SDF.</p>
        </div>

        <RefreshButton onClick={onRefresh} disabled={loading} />
      </div>

      <div className="mini-metrics-grid three">
        <div className="mini-metric-card">
          <span>Total de usuarios</span>
          <strong>{users.length}</strong>
        </div>
        <div className="mini-metric-card">
          <span>Activos</span>
          <strong>{activeUsers}</strong>
        </div>
        <div className="mini-metric-card">
          <span>Inactivos</span>
          <strong>{inactiveUsers}</strong>
        </div>
      </div>

      <div className="forms-grid">
        <form className="form-card" onSubmit={handleCreate}>
          <h3>Crear usuario</h3>

          <label className="field-label">
            Nombre del abonado
            <input
              placeholder="Ej. Mario López"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>

          <label className="field-label">
            Número en formato E.164
            <input
              placeholder="+52XXXXXXXXXX"
              value={form.phone_number}
              onChange={(e) =>
                setForm({ ...form, phone_number: e.target.value })
              }
              required
            />
          </label>

          <label className="field-label">
            Saldo inicial
            <input
              type="number"
              step="0.01"
              placeholder="Saldo inicial"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              required
            />
          </label>

          <label className="field-label">
            Estado del abonado
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </label>

          <button type="submit" className="btn-primary">
            Guardar usuario
          </button>
        </form>

        <form className="form-card" onSubmit={handleRecharge}>
          <h3>Recargar saldo</h3>

          <label className="field-label">
            ID de usuario
            <input
              placeholder="Ej. 1"
              value={recharge.userId}
              onChange={(e) =>
                setRecharge({ ...recharge, userId: e.target.value })
              }
              required
            />
          </label>

          <label className="field-label">
            Monto de recarga
            <input
              type="number"
              step="0.01"
              placeholder="Monto"
              value={recharge.amount}
              onChange={(e) =>
                setRecharge({ ...recharge, amount: e.target.value })
              }
              required
            />
          </label>

          <button type="submit" className="btn-primary">
            Aplicar recarga
          </button>
        </form>
      </div>

      <div className="filter-card">
        <div className="search-box">
          <span>🔎</span>
          <input
            placeholder="Buscar por ID, nombre o número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">Todos los usuarios</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>

        <button
          className="btn-ghost"
          onClick={() => {
            setSearch('');
            setStatusFilter('ALL');
          }}
        >
          Limpiar filtros
        </button>
      </div>

      <div className="result-counter">
        Mostrando <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuarios.
      </div>

      {message && <p className="message-line">{message}</p>}

      <UsersTable users={filteredUsers} />
    </div>
  );
}