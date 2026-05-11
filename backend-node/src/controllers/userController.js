const { pool } = require('../config/db');

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

function isE164(value) {
  return E164_REGEX.test(value || '');
}

async function getUsers(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, phone_number, balance, status, created_at, updated_at FROM users ORDER BY id ASC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, phone_number, balance = 0, status = 'active' } = req.body;

    if (!name || !phone_number) {
      res.status(400).json({ error: 'name y phone_number son obligatorios' });
      return;
    }

    if (!isE164(phone_number)) {
      res.status(400).json({ error: 'phone_number debe estar en formato E.164' });
      return;
    }

    if (!['active', 'inactive'].includes(status)) {
      res.status(400).json({ error: 'status invalido' });
      return;
    }

    const [result] = await pool.execute(
      'INSERT INTO users (name, phone_number, balance, status) VALUES (?, ?, ?, ?)',
      [name, phone_number, Number(balance), status]
    );

    const [rows] = await pool.execute(
      'SELECT id, name, phone_number, balance, status, created_at, updated_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, phone_number, balance, status, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

async function rechargeUser(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const userId = req.params.id;
    const amount = Number(req.body.amount);

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      res.status(400).json({ error: 'amount debe ser mayor a 0' });
      return;
    }

    await connection.beginTransaction();

    const [users] = await connection.execute(
      'SELECT id, balance FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );

    if (!users.length) {
      await connection.rollback();
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    await connection.execute('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, userId]);
    await connection.execute('INSERT INTO recharges (user_id, amount) VALUES (?, ?)', [userId, amount]);

    await connection.commit();

    const [rows] = await pool.execute(
      'SELECT id, name, phone_number, balance, status, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json(rows[0]);
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

module.exports = {
  getUsers,
  createUser,
  getUserById,
  rechargeUser
};
