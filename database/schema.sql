-- ==========================================================================
-- SISTEMA INTELIGENTE DE RECARGA VoIP
-- Base de Datos: intelligent_network_db
-- 
-- ELEMENTO DE RED INTELIGENTE: SDF (Service Data Function)
-- 
-- Esta base de datos representa el SDF en una Red Inteligente (UIT-T Q.1200).
-- El SDF es responsable de almacenar y proveer información de usuarios, saldos,
-- historial de llamadas y logs de decisiones tomadas por el SCF (Python FastAPI).
--
-- Physical Plane (UIT-T Q.1200): Base de datos física en MySQL.
-- ==========================================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS voip_intelligent_network_db;
USE voip_intelligent_network_db;


-- ==========================================================================
-- TABLA: users
-- DESCRIPCIÓN: Almacena información de usuarios del sistema VoIP
-- ==========================================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone_number (phone_number),
    INDEX idx_status (status)
);


-- ==========================================================================
-- TABLA: recharges
-- DESCRIPCIÓN: Historial de recargas de saldo realizadas por usuarios
-- ==========================================================================
CREATE TABLE IF NOT EXISTS recharges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- ==========================================================================
-- TABLA: calls
-- DESCRIPCIÓN: Registro de llamadas recibidas por el sistema (SSF)
-- 
-- ELEMENTO DE RED INTELIGENTE:
-- - from_number: Número origen de la llamada (SSF - Twilio)
-- - to_number: Número destino de la llamada
-- - decision: Decisión tomada por el SCF (ALLOW_CALL o REJECT_CALL)
-- - reason: Motivo de la decisión
-- - cost: Costo de la llamada (costo mínimo: 1.00)
-- - duration_seconds: Duración de la llamada en segundos
-- ==========================================================================
CREATE TABLE IF NOT EXISTS calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20),
    decision ENUM('ALLOW_CALL', 'REJECT_CALL') NOT NULL,
    reason VARCHAR(255),
    cost DECIMAL(10, 2) DEFAULT 1.00,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_from_number (from_number),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_decision (decision)
);


-- ==========================================================================
-- TABLA: decision_logs
-- DESCRIPCIÓN: Logs de decisiones inteligentes tomadas por el SCF (Python)
-- 
-- ELEMENTO DE RED INTELIGENTE:
-- - Esta tabla es responsabilidad del SCF (Service Control Function)
-- - El SCF (Python FastAPI) registra aquí cada decisión de autorización
--   o rechazo de llamada basada en la lógica inteligente.
-- - balance_before: Saldo del usuario ANTES de procesar la llamada
-- - cost: Costo de la llamada (1.00 por defecto)
-- - Si decision = 'ALLOW_CALL', el SCF descuenta el saldo.
-- - Si decision = 'REJECT_CALL', no se descuenta saldo.
--
-- UIT-T Q.1200 - Functional Planes:
-- - Service Plane: Autorización de llamada con verificación de saldo
-- - Global Functional Plane: SIB (Service Information Block) de verificación
-- - Distributed Functional Plane: SCF (Python) + SDF (MySQL)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS decision_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    phone_number VARCHAR(20) NOT NULL,
    decision ENUM('ALLOW_CALL', 'REJECT_CALL') NOT NULL,
    reason VARCHAR(255),
    balance_before DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2) DEFAULT 1.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_phone_number (phone_number),
    INDEX idx_decision (decision),
    INDEX idx_created_at (created_at)   
)

-- ==========================================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ==========================================================================
CREATE INDEX idx_users_balance ON users(balance);
CREATE INDEX idx_calls_user_from ON calls(user_id, from_number);
CREATE INDEX idx_decision_logs_user_phone ON decision_logs(user_id, phone_number);


-- ==========================================================================
-- COMENTARIOS DE ARQUITECTURA
-- ==========================================================================
/*
MAPEO CON UIT-T Q.1200 - RED INTELIGENTE:
1. SERVICE PLANE (Plano de Servicios)
   Servicio: "Llamada telefónica con verificación inteligente de saldo"
2. GLOBAL FUNCTIONAL PLANE (Plano Funcional Global)
   - SIB (Service Information Block): Verificación de usuario y saldo
   - BCP (Basic Call Process): Validar usuario, verificar saldo, autorizar/rechazar
   - POI (Point of Initiation): Recepción de llamada en SSF (Twilio)
   - POR (Point of Return): Respuesta TwiML al SSF
3. DISTRIBUTED FUNCTIONAL PLANE (Plano Funcional Distribuido)
   - SSF (Service Switching Function): Twilio (recibe llamada)
   - SCF (Service Control Function): Python FastAPI (toma decisión inteligente)
   - SDF (Service Data Function): MySQL (almacena usuarios y decisiones)
   - IF (Intelligent Network Function): HTTP REST entre componentes
4. PHYSICAL PLANE (Plano Físico)
   - SSP/IP: Twilio (punto de conmutación)
   - SCP (Service Control Point): Python (lógica inteligente)
   - AS (Application Server): Node.js (orquestador)
   - DB: MySQL (almacenamiento)
TABLA: users
- Representa el SDF: almacena información de usuarios
- Consulta crítica para SCF: obtener balance por phone_number
TABLA: decision_logs
- Responsabilidad del SCF: registrar cada decisión
- Incluye balance_before para auditoría
- Transaccional: SCF debe actualizar users.balance y insertar en decision_logs
TABLA: calls
- Responsabilidad del SSF (Node.js): registrar llamadas recibidas
- Incluye decision del SCF para auditoría
- Historial para el usuario final
TABLA: recharges
- Almacena operaciones de recarga de saldo
- Permite auditoría de movimientos de saldo
*/