# Prueba principal con llamada real

Esta es la prueba valida para evaluacion profesional del proyecto, porque comprueba el flujo real de telefonia con Twilio y no solo una simulacion local.

## 1) Flujo que debe observarse

```text
Celular fisico
  -> Twilio Voice
  -> ngrok
  -> Node (webhook)
  -> Python (decision)
  -> MySQL (registro)
  -> TwiML
  -> Audio al usuario
```

## 2) Precondiciones

1. Python activo en `http://localhost:8000/health`.
2. Node activo en `http://localhost:3000/health`.
3. ngrok exponiendo puerto `3000`.
4. Twilio configurado con webhook `POST` actualizado.
5. Usuario de prueba creado con telefono E.164 exacto.
6. Dependencias instaladas en Python, Node y React.

## 3) Ejecucion de prueba

1. Desde celular real, llamar al numero Twilio.
2. Confirmar que Twilio llama a:

```text
https://TU_URL_NGROK/webhooks/twilio/incoming-call
```

3. Verificar en Node que se imprimen `From`, `To`, `CallSid` y `Decision`.
4. Validar que Python responde una decision (`ALLOW_CALL` o `REJECT_CALL`).
5. Confirmar audio final en la llamada.

## 4) Evidencias que debes capturar

- Captura del request en ngrok inspector (`:4040`).
- Fragmento de log de Node con decision de la llamada.
- Registro insertado en `calls` con `twilio_call_sid` y `account_sid`.
- Registro en `decision_logs` con motivo de la regla aplicada.

## 5) Entradas y salidas esperadas

### Payload de entrada (Twilio)

```text
From=+52XXXXXXXXXX
To=+19012675646
CallSid=CAxxxxxxxx
CallStatus=ringing
Direction=inbound
AccountSid=ACxxxxxxxx
```

### Respuesta de salida (TwiML)

`ALLOW_CALL`:

```xml
<Response>
  <Say language="es-MX">Llamada autorizada. Su saldo es suficiente.</Say>
  <Pause length="1"/>
  <Say language="es-MX">Esta es una demostracion del sistema de prepago VoIP basado en Redes Inteligentes.</Say>
</Response>
```

`REJECT_CALL`:

```xml
<Response>
  <Say language="es-MX">Llamada rechazada. Saldo insuficiente o usuario no registrado.</Say>
  <Hangup/>
</Response>
```

## 6) Criterios de aceptacion

- El webhook real llega con HTTP `POST`.
- Node responde HTTP `200` y `Content-Type: text/xml`.
- El motivo de decision coincide con datos de `users`.
- La evidencia en BD coincide con lo escuchado por el usuario.

## 7) Fallas tipicas durante la prueba

| Falla | Causa probable | Correccion |
|---|---|---|
| No entra webhook | URL ngrok caducada | Actualizar URL en Twilio |
| Llamada rechazada inesperada | Telefono no coincide en E.164 | Corregir `users.phone_number` |
| Rechazo por saldo | `balance < MIN_CALL_COST` | Recargar saldo o bajar costo minimo |
| Sin respuesta de voz | Error previo en Node/Python | Revisar logs y endpoints `/health` |
