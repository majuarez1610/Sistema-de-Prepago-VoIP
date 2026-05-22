import React from 'react';
import { useState } from 'react';
import UsersTable from '../components/UsersTable';
import RefreshButton from '../components/RefreshButton';

export default function Users({ users, loading, onRefresh, onCreateUser, onRechargeUser }) {
  const [form, setForm] = useState({ name: '', phone_number: '', balance: '10.00', status: 'active' });
  const [recharge, setRecharge] = useState({ userId: '', amount: '1.00' });
  const [message, setMessage] = useState('');

  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage('Procesando...');
    try {
      await onCreateUser({
        name: form.name,
        phone_number: form.phone_number,
        balance: Number(form.balance),
        status: form.status
      });
      setMessage('Usuario creado correctamente');
      setForm({ name: '', phone_number: '', balance: '10.00', status: 'active' });
    } catch (error) {
      setMessage(`Error al crear usuario: ${error.message}`);
    }
  };

  const handleRecharge = async (event) => {
    event.preventDefault();
    setMessage('Procesando recarga...');
    try {
      await onRechargeUser(recharge.userId, Number(recharge.amount));
      setMessage('Recarga aplicada correctamente');
      setRecharge({ userId: '', amount: '1.00' });
    } catch (error) {
      setMessage(`Error en recarga: ${error.message}`);
    }
  };

  return (
    <div className="page">
      <div className="page-actions">
        <RefreshButton onClick={onRefresh} disabled={loading} />
      </div>

      <div className="forms-grid">
        <form className="form-card" onSubmit={handleCreate}>
          <h3>Crear usuario</h3>
          <input
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="+52XXXXXXXXXX"
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Saldo inicial"
            value={form.balance}
            onChange={(e) => setForm({ ...form, balance: e.target.value })}
            required
          />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <button type="submit">Guardar usuario</button>
        </form>

        <form className="form-card" onSubmit={handleRecharge}>
          <h3>Recargar saldo</h3>
          <input
            placeholder="ID de usuario"
            value={recharge.userId}
            onChange={(e) => setRecharge({ ...recharge, userId: e.target.value })}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Monto"
            value={recharge.amount}
            onChange={(e) => setRecharge({ ...recharge, amount: e.target.value })}
            required
          />
          <button type="submit">Aplicar recarga</button>
        </form>
      </div>

      {message && <p className="message-line">{message}</p>}

      <UsersTable users={users} />
    </div>
  );
}

