USE intelligent_network_db;

-- 1) Limpiar historial operativo
DELETE FROM calls;
DELETE FROM decision_logs;
DELETE FROM recharges;

-- 2) Limpiar usuarios
DELETE FROM users;

-- 3) Reiniciar auto_increment
ALTER TABLE recharges AUTO_INCREMENT = 1;
ALTER TABLE calls AUTO_INCREMENT = 1;
ALTER TABLE decision_logs AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- 4) Insertar usuario unico para pruebas reales
-- EDITA ESTE NUMERO ANTES DE EJECUTAR: usa formato E.164, por ejemplo +52XXXXXXXXXX
INSERT INTO users (id, name, phone_number, balance, status)
VALUES (1, 'Usuario Real', '+52XXXXXXXXXX', 10.00, 'active');
