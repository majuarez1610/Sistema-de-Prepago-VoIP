# Arquitectura general del sistema

## 1) Vista de alto nivel

```text
Celular fisico
   -> Twilio Voice Number
   -> ngrok (tunel HTTPS publico)
   -> Node.js SSF (webhook y orquestacion)
   -> Python SCF (decision inteligente)
   -> MySQL SDF (persistencia)
   -> Node responde TwiML
   -> Twilio reproduce audio en la llamada real
```

## 2) Principios de diseno

- Separacion de responsabilidades: control de llamada en Node, logica de decision en Python.
- Persistencia centralizada en MySQL para trazabilidad completa.
- Integracion orientada a evento real de telefonia (Twilio webhook), no simulacion local.
- Observabilidad basica por logs, endpoints de salud y registros en base de datos.

## 3) Componentes y responsabilidades

| Componente | Rol | Responsabilidad principal |
|---|---|---|
| Twilio Voice | SSP/IP | Recibir llamada PSTN/VoIP y disparar webhook |
| ngrok | Exposicion | Publicar endpoint local de Node por HTTPS |
| Node.js + Express | SSF | Recibir webhook, consultar SCF, guardar llamada, responder TwiML |
| Python + FastAPI | SCF | Aplicar reglas de negocio de prepago |
| MySQL | SDF | Almacenar entidades operativas y auditoria |
| React + Vite | Panel | Mostrar estado de usuarios, llamadas y decisiones |

## 4) Modelo de datos operativo

| Tabla | Proposito | Campos relevantes |
|---|---|---|
| `users` | Estado del suscriptor | `phone_number`, `balance`, `status` |
| `recharges` | Historial de recargas | `user_id`, `amount`, `created_at` |
| `calls` | Registro de trafico de llamada | `from_number`, `to_number`, `twilio_call_sid`, `decision`, `reason` |
| `decision_logs` | Auditoria de la logica SCF | `phone_number`, `decision`, `reason`, `balance_before`, `cost` |

## 5) Secuencia tecnica de una llamada

1. El usuario marca al numero Twilio.
2. Twilio envia `POST /webhooks/twilio/incoming-call` con payload `application/x-www-form-urlencoded`.
3. Node extrae `From`, `To`, `CallSid`, `CallStatus`, `Direction`, `AccountSid`.
4. Node invoca `POST /decision/call` en Python (JSON).
5. Python consulta `users`, evalua reglas y responde `ALLOW_CALL` o `REJECT_CALL`.
6. Node persiste el resultado en `calls`.
7. Node devuelve TwiML con mensaje de autorizacion o rechazo.
8. Twilio reproduce audio al usuario final.

## 6) Interfaces de integracion

| Endpoint | Metodo | Consumidor | Proposito |
|---|---|---|---|
| `/webhooks/twilio/incoming-call` | `POST` | Twilio | Flujo principal de llamada real |
| `/webhooks/twilio/test` | `GET` | Operador | Prueba de depuracion local |
| `/decision/call` | `POST` | Node | Consulta de decision SCF |
| `/health` (Node) | `GET` | Operador/monitor | Estado de Node + MySQL + Python |
| `/health` (Python) | `GET` | Node/operador | Estado del SCF |

## 7) Estados de negocio

| Estado | Condicion | Resultado |
|---|---|---|
| Usuario activo con saldo | `status=active` y `balance >= MIN_CALL_COST` | `ALLOW_CALL` |
| Usuario inexistente | `phone_number` no encontrado | `REJECT_CALL` |
| Usuario inactivo | `status=inactive` | `REJECT_CALL` |
| Saldo insuficiente | `balance < MIN_CALL_COST` | `REJECT_CALL` |

## 8) Criterios de validacion arquitectonica

- Existe trafico real en `http://127.0.0.1:4040`.
- Node responde `text/xml` y codigo HTTP consistente.
- Se registran filas en `calls` y `decision_logs` por cada intento.
- El audio escuchado coincide con la decision persistida.
