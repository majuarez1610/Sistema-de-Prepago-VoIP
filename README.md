# Sistema de Prepago VoIP con Red Inteligente

Proyecto academico para demostrar una Red Inteligente donde la prioridad es una llamada real desde celular fisico hacia Twilio, no una simulacion local.

## 1) Objetivo del sistema

Autorizar o rechazar llamadas entrantes con base en saldo prepago y estado del usuario.

- Si el usuario existe, esta activo y tiene saldo: `ALLOW_CALL`.
- Si no existe, esta inactivo o no tiene saldo: `REJECT_CALL`.

## 2) Flujo principal (el mas importante)

```text
Celular fisico
    |
    v
Numero real de Twilio (Voice)
    |
    v
Webhook HTTP POST por ngrok
https://TU_URL_NGROK/webhooks/twilio/incoming-call
    |
    v
Node.js (SSF) -> consulta -> Python FastAPI (SCF)
    |                              |
    |                              v
    |                           MySQL (SDF)
    |
    v
TwiML XML de respuesta
    |
    v
Twilio reproduce audio en la llamada real
```

## 3) Arquitectura rapida

| Componente | Rol academico | Funcion |
|---|---|---|
| Twilio Voice | SSP/IP | Recibe llamada real y dispara webhook |
| Node.js Express | SSF | Orquesta llamada, consulta SCF, responde TwiML |
| Python FastAPI | SCF | Decide ALLOW_CALL/REJECT_CALL |
| MySQL | SDF | Guarda usuarios, llamadas, recargas y decisiones |
| HTTP REST | IF | Interfaz entre SSF y SCF |
| React | Panel | Visualiza usuarios, llamadas y decisiones |

## 4) Tecnologias

- Frontend: React + Vite (JavaScript)
- Backend: Node.js + Express
- Servicio inteligente: Python + FastAPI
- Base de datos: MySQL
- Webhook real: Twilio Voice
- Exposicion local publica: ngrok

## 5) Como ejecutar (resumen)

Detalle completo en `docs/04-ejecucion-local.md`.

1. Crear tablas con `database/schema.sql`.
2. Insertar usuario de ejemplo con `database/seed.example.sql` y reemplazar por tu numero real E.164.
3. Levantar Python en puerto `8000`.
4. Levantar Node en puerto `3000`.
5. Levantar React.
6. Levantar ngrok: `ngrok http 3000`.
7. Configurar Twilio con URL webhook:

```text
https://TU_URL_NGROK/webhooks/twilio/incoming-call
```

## 6) Diagrama de terminales

```text
Terminal 1: Python SCF
  cd intelligent-service-python
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Terminal 2: Node SSF
  cd backend-node
  npm run dev

Terminal 3: ngrok
  ngrok http 3000

Terminal 4: React Panel
  cd frontend-react
  npm run dev
```

## 7) Que esta pasando aqui

- Twilio envia datos reales del evento de llamada (`From`, `To`, `CallSid`, `CallStatus`, `Direction`, `AccountSid`).
- Node llama a Python con `POST /decision/call`.
- Python consulta MySQL y decide.
- Node guarda la llamada en `calls` y responde TwiML en `text/xml`.
- Twilio reproduce mensaje al usuario real.

## 8) Como saber si funciona

- En `http://127.0.0.1:4040` aparece request POST de Twilio.
- En logs Node aparece:
  - `[TWILIO WEBHOOK] Incoming real call`
  - `From`, `To`, `CallSid`, `Decision`.
- En MySQL aparece registro en `calls` con `account_sid` y `twilio_call_sid`.
- En `decision_logs` aparece la decision del SCF.
- En React se ven llamadas y decisiones nuevas al actualizar.

## 9) Si falla, revisa esto

- URL de Twilio mal configurada o metodo incorrecto (debe ser POST).
- ngrok apagado o URL vencida.
- Numero del usuario mal guardado (debe ser E.164 exacto: `+52XXXXXXXXXX`).
- Credenciales MySQL mal definidas en `.env`.
- Cuenta Twilio trial sin numero verificado.

## 10) Prueba principal vs prueba secundaria

### Prueba principal (obligatoria para exposicion)

Llamar desde celular fisico al numero Twilio y validar el flujo completo real.

### Prueba secundaria (solo apoyo)

- `GET /webhooks/twilio/test`
- POST manual con cURL/PowerShell

Estas pruebas ayudan a depurar, pero no sustituyen el evento real de Twilio.

## 11) Documentacion detallada

- `docs/01-arquitectura.md`
- `docs/02-red-inteligente-uit-q1200.md`
- `docs/03-configuracion-twilio-ngrok.md`
- `docs/04-ejecucion-local.md`
- `docs/05-pruebas-llamada-real.md`
- `docs/06-pruebas-consola-secundarias.md`
- `docs/07-solucion-errores.md`
