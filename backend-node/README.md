# Backend Node.js (SSF)

Este backend representa el **SSF (Service Switching Function)**.

Su funcion principal es recibir la llamada real de Twilio por webhook, consultar al SCF en Python y responder TwiML.

## Configuracion

1. Copia `.env.example` a `.env`.
2. Ajusta credenciales de MySQL y URL del servicio Python.

## Ejecucion

```bash
npm install
npm run dev
```

## Endpoint principal de llamada real

- `POST /webhooks/twilio/incoming-call`
- Content-Type: `application/x-www-form-urlencoded`

Campos relevantes de Twilio:

- `From`
- `To`
- `CallSid`
- `CallStatus`
- `Direction`
- `AccountSid`

## Endpoint secundario de simulacion

- `GET /webhooks/twilio/test?from=+52XXXXXXXXXX&to=+19012675646`

Solo para pruebas de consola/navegador. La prioridad principal es la llamada real desde celular fisico.
