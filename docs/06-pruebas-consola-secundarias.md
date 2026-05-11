# Pruebas secundarias por consola

Estas pruebas aceleran la depuracion tecnica, pero no sustituyen la validacion oficial con llamada real.

## 1) Alcance de estas pruebas

```text
Consola local -> Node -> Python -> MySQL
```

Permiten validar:

- Logica de decision y persistencia.
- Formato de respuesta TwiML.
- Conectividad Node-Python-MySQL.

No permiten validar:

- Entrega real de webhook desde Twilio.
- Exposicion publica por ngrok en condiciones reales.
- Experiencia de audio en llamada telefonica.

## 2) Prueba A: GET de simulacion

Endpoint:

```text
GET /webhooks/twilio/test?from=+52XXXXXXXXXX&to=+19012675646
```

Ejemplo con `curl`:

```bash
curl "http://localhost:3000/webhooks/twilio/test?from=%2B52XXXXXXXXXX&to=%2B19012675646"
```

Comportamiento esperado:

- Node construye payload simulado.
- Se ejecuta la consulta al SCF.
- Se devuelve TwiML segun decision.

## 3) Prueba B: POST manual estilo Twilio

### `curl`

```bash
curl -X POST "http://localhost:3000/webhooks/twilio/incoming-call" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=%2B52XXXXXXXXXX&To=%2B19012675646&CallSid=CA_TEST&CallStatus=ringing&Direction=inbound-api&AccountSid=AC_TEST"
```

### PowerShell

```powershell
Invoke-WebRequest -Method POST -Uri "http://localhost:3000/webhooks/twilio/incoming-call" -ContentType "application/x-www-form-urlencoded" -Body "From=%2B52XXXXXXXXXX&To=%2B19012675646&CallSid=CA_TEST&CallStatus=ringing&Direction=inbound-api&AccountSid=AC_TEST"
```

## 4) Resultado esperado

- Codigo HTTP `200`.
- Encabezado `Content-Type: text/xml`.
- Cuerpo TwiML con mensaje de autorizacion o rechazo.
- Insercion en tablas `calls` y `decision_logs`.

## 5) Criterios de aprobacion tecnica

- El telefono de entrada `From` coincide con formato E.164.
- La decision en respuesta coincide con el estado real en tabla `users`.
- No existen errores de conexion en logs de Node/Python.

## 6) Errores frecuentes en pruebas secundarias

| Error | Causa | Solucion |
|---|---|---|
| Respuesta 400 | Campo `From` faltante o invalido | Enviar `From` con E.164 valido |
| Respuesta 500 | Error interno de Node o DB | Revisar stacktrace y `.env` |
| Rechazo inesperado | Usuario no existe/inactivo/sin saldo | Verificar tabla `users` y `MIN_CALL_COST` |
| Timeout hacia Python | SCF detenido o URL incorrecta | Levantar SCF y validar `PYTHON_SERVICE_URL` |

## 7) Uso recomendado

- Ejecutar estas pruebas antes de la llamada real.
- Usarlas para aislar problemas de negocio o persistencia.
- Pasar a prueba principal cuando el flujo local ya sea estable.
