# Pruebas secundarias por consola

Estas pruebas son utiles para depuracion rapida, pero no reemplazan la prueba principal con llamada real.

## Por que son secundarias

```text
Consola -> Node local -> Python -> MySQL
```

En este camino no validas:
- que Twilio realmente dispare webhook,
- que ngrok reciba trafico externo,
- que el audio llegue al usuario real.

## Prueba secundaria 1: GET de simulacion

Endpoint:

```text
GET /webhooks/twilio/test?from=+52XXXXXXXXXX&to=+19012675646
```

Ejemplo:

```bash
curl "http://localhost:3000/webhooks/twilio/test?from=%2B52XXXXXXXXXX&to=%2B19012675646"
```

Que esta pasando aqui:
- Node construye un payload simulado parecido al de Twilio y procesa decision.

## Prueba secundaria 2: POST manual estilo Twilio

```bash
curl -X POST "http://localhost:3000/webhooks/twilio/incoming-call" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=%2B52XXXXXXXXXX&To=%2B19012675646&CallSid=CA_TEST&CallStatus=ringing&Direction=inbound-api&AccountSid=AC_TEST"
```

PowerShell:

```powershell
Invoke-WebRequest -Method POST -Uri "http://localhost:3000/webhooks/twilio/incoming-call" -ContentType "application/x-www-form-urlencoded" -Body "From=%2B52XXXXXXXXXX&To=%2B19012675646&CallSid=CA_TEST&CallStatus=ringing&Direction=inbound-api&AccountSid=AC_TEST"
```

## Resultado esperado

- HTTP `200`.
- Header `Content-Type: text/xml`.
- Body TwiML con mensaje de autorizacion o rechazo.

## Como saber si funciona

- Se inserta registro en `calls`.
- Se inserta registro en `decision_logs`.
- El `From` prueba coincidencia con usuario E.164.

## Si falla, revisa esto

- `From` sin formato E.164.
- Usuario inexistente.
- Python no esta levantado.
- Credenciales MySQL invalidas en `.env`.
