# Mapeo academico a UIT-T Q.1200

Este documento justifica el diseno del proyecto con base en la arquitectura de Red Inteligente definida en UIT-T Q.1200, manteniendo correspondencia entre planos conceptuales y componentes implementados.

## 1) Vista por planos

```text
SERVICE PLANE
Servicio: Prepago VoIP con control de saldo en tiempo real

GLOBAL FUNCTIONAL PLANE
SIB + BCP + POI + POR (logica y secuencia del servicio)

DISTRIBUTED FUNCTIONAL PLANE
SSF (Node) <-> IF (REST) <-> SCF (Python) <-> SDF (MySQL)

PHYSICAL PLANE
Celular -> Twilio -> ngrok -> Node -> Python -> MySQL
```

## 2) Equivalencia formal Q.1200

| Concepto Q.1200 | Implementacion | Evidencia tecnica |
|---|---|---|
| SSP/IP | Twilio Voice | Recibe llamada real y envia webhook |
| SSF | Node.js Express | Endpoint `/webhooks/twilio/incoming-call` |
| SCF | Python FastAPI | Endpoint `/decision/call` con reglas de negocio |
| SDF | MySQL | Tablas `users`, `calls`, `decision_logs` |
| IF | HTTP REST | Integracion JSON Node-Python |
| SIB | Motor de decision | Validaciones de usuario, estado y saldo |
| BCP | Flujo de control | Secuencia webhook -> decision -> respuesta |
| POI | Punto de inicio | Evento de llamada entrante en Twilio |
| POR | Punto de retorno | Respuesta TwiML al SSP/IP |

## 3) Interpretacion funcional

- `POI`: se activa cuando el abonado marca al numero Twilio.
- `SSF`: interpreta el evento y prepara parametros de control.
- `IF`: transporta consulta entre funciones de control por HTTP.
- `SCF`: aplica la logica del servicio prepago con datos en `SDF`.
- `POR`: devuelve accion final (`ALLOW_CALL` o `REJECT_CALL`) materializada en TwiML.

## 4) Relacion SIB-BCP con el codigo

### SIB de autorizacion

Reglas implementadas en el SCF:

1. Verificar existencia de `phone_number`.
2. Verificar `status = active`.
3. Verificar `balance >= MIN_CALL_COST`.
4. Si aplica, descontar costo y registrar decision.

### BCP de servicio

1. Recibir webhook real desde Twilio (SSF).
2. Consultar SIB de decision (SCF).
3. Persistir resultado operativo.
4. Generar POR en formato TwiML.

## 5) Caso de referencia para exposicion

```text
POI: Twilio recibe llamada de +52XXXXXXXXXX
  -> SSF (Node) recibe webhook
  -> IF llama SCF (/decision/call)
  -> SCF consulta SDF y decide
  -> SSF guarda evento en calls
  -> POR: SSF retorna TwiML a Twilio
  -> Usuario escucha audio de autorizacion/rechazo
```

## 6) Criterios de conformidad academica

- Existe separacion entre control de servicio (SSF/SCF) y datos (SDF).
- Se demuestra evento real de red, no solo trafico simulado.
- El resultado del servicio es trazable en base de datos y logs.
- El mapeo Q.1200 puede verificarse en tiempo de ejecucion durante la demo.
