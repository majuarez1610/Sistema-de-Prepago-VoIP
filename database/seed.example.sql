USE intelligent_network_db;

-- Reemplaza el valor de phone_number por tu numero real en formato E.164.
-- Ejemplo de formato valido: +521234567890
INSERT INTO users (name, phone_number, balance, status)
VALUES ('Usuario de Ejemplo', '+521234567890', 10.00, 'active');
