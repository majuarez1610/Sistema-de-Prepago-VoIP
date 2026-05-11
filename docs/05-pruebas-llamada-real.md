# Prueba principal con llamada real

## Este es el flujo que vale para la exposicion

```text
Celular fisico
   -> Twilio
   -> ngrok
   -> Node.js
   -> Python
   -> MySQL
   -> TwiML
   -> Audio en llamada real
```

## Preparacion

1. Python levantado en `8000`.
2. Node levantado en `3000`.
3. ngrok levantado hacia `3000`.
4. Twilio configurado con webhook POST.
5. Usuario real guardado en MySQL con E.164 exacto.

## Paso a paso

1. Marca desde tu celular al numero Twilio.
2. Twilio manda POST a:

```text
https://TU_URL_NGROK/webhooks/twilio/incoming-call
```

3. Node lee `From`, `To`, `CallSid`, `CallStatus`, `Direction`, `AccountSid`.
4. Node consulta Python con `POST /decision/call`.
5. Python consulta usuario y decide.
6. Node guarda registro en `calls`.
7. Twilio reproduce audio segun decision.

## Ejemplo visual de entrada Twilio (form-urlencoded)

```text
From=+52XXXXXXXXXX
To=+19012675646
CallSid=CAxxxxxxxx
CallStatus=ringing
Direction=inbound
AccountSid=ACxxxxxxxx
```

## Ejemplo visual de salida TwiML

### Si ALLOW_CALL

```xml
<Response>
  <Say language="es-MX">Llamada autorizada. Su saldo es suficiente.</Say>
  <Pause length="1"/>
  <Say language="es-MX">Esta es una demostración del sistema de prepago VoIP basado en Redes Inteligentes.</Say>
</Response>
```

### Si REJECT_CALL

```xml
<Response>
  <Say language="es-MX">Llamada rechazada. Saldo insuficiente o usuario no registrado.</Say>
  <Hangup/>
</Response>
```

## Como saber si funciona

- En ngrok inspector aparece request POST real.
- En Node logs aparece `[TWILIO WEBHOOK] Incoming real call`.
- En MySQL:
  - `calls.twilio_call_sid` lleno.
  - `calls.account_sid` lleno.
  - `calls.decision` correcto.
- En `decision_logs` aparece la regla aplicada.
- El audio coincide con la decision.

## Si falla, revisa esto

- El numero de `users.phone_number` no coincide exactamente con `From`.
- Usuario en `inactive`.
- Saldo menor a `MIN_CALL_COST`.
- ngrok sin conexion activa.
- Webhook Twilio con URL vieja.
