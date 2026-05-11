# Arquitectura general del sistema

## Vista rapida

```text
Celular fisico
    |
    v
Twilio Voice Number (evento real)
    |
    v
ngrok (tunel publico)
    |
    v
POST /webhooks/twilio/incoming-call (Node.js SSF)
    |
    +--> POST /decision/call (Python SCF)
    |         |
    |         v
    |      MySQL (SDF)
    |
    v
Respuesta TwiML (text/xml)
    |
    v
Audio reproducido al usuario en la llamada
```

## Que esta pasando aqui

- El usuario no marca a tu servidor local: marca a **Twilio**.
- Twilio envia el evento de llamada por webhook hacia tu backend publico via ngrok.
- Node toma el papel de SSF y consulta al SCF (Python).
- Python decide y actualiza saldo en MySQL.
- Node responde TwiML y Twilio reproduce el audio.

## Roles por capa

| Capa/Elemento | Implementacion | Funcion |
|---|---|---|
| Entrada de llamada | Twilio | Recibir llamada real |
| Orquestacion | Node.js Express | Recibir webhook, llamar SCF, devolver TwiML |
| Decision inteligente | Python FastAPI | Validar usuario/saldo, descontar costo |
| Datos | MySQL | Persistir usuarios, llamadas, recargas, logs |
| Visualizacion | React | Panel de administracion |

## Flujo paso a paso

1. Llamada real al numero de Twilio.
2. Twilio manda POST con `From`, `To`, `CallSid`, `CallStatus`, `Direction`, `AccountSid`.
3. Node valida `From` y consulta SCF con `POST /decision/call`.
4. SCF busca `phone_number` y decide `ALLOW_CALL` o `REJECT_CALL`.
5. Node guarda la llamada en `calls` (incluye `account_sid`).
6. Node responde TwiML XML.
7. Twilio reproduce audio al usuario.
8. React muestra la llamada y la decision al actualizar.

## Interfaces clave

| Endpoint | Proposito | Tipo |
|---|---|---|
| `POST /webhooks/twilio/incoming-call` | Flujo principal real | `application/x-www-form-urlencoded` |
| `GET /webhooks/twilio/test` | Prueba secundaria | Query params |
| `POST /decision/call` | Decision SCF | JSON |
| `GET /api/users` | Consultar usuarios | JSON |
| `GET /api/calls` | Consultar llamadas | JSON |
| `GET /api/decisions` | Consultar decisiones | JSON |

## Como saber si funciona

- ngrok inspector (`http://127.0.0.1:4040`) muestra POST entrante.
- Node imprime logs del webhook real.
- Tabla `calls` guarda `twilio_call_sid` y `account_sid`.
- Twilio reproduce mensaje segun decision.
