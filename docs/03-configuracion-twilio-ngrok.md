# Configuracion de Twilio y ngrok

Esta guia conecta tu backend local con llamadas reales de Twilio.

## Mapa visual rapido

```text
Celular fisico
   |
   v
Twilio Number
   |
   v
Webhook POST
https://TU_URL_NGROK/webhooks/twilio/incoming-call
   |
   v
ngrok -> localhost:3000 (Node.js)
```

## Paso 1) Instalar ngrok

Descarga ngrok desde su sitio oficial, extrae el ejecutable y verifica:

```bash
ngrok version
```

## Paso 2) Registrar authtoken

```bash
ngrok config add-authtoken TU_AUTHTOKEN
```

Que esta pasando aqui:
- ngrok enlaza tu cuenta para habilitar tuneles estables.

## Paso 3) Abrir tunel al backend Node

```bash
ngrok http 3000
```

Salida esperada (ejemplo visual):

```text
Forwarding  https://TU_URL_NGROK -> http://localhost:3000
```

## Paso 4) Configurar webhook en Twilio

Ruta en consola Twilio:

1. `Active Numbers`
2. Elegir numero Twilio
3. `Voice Configuration`
4. `A call comes in`
5. Seleccionar `Webhook`
6. Metodo `HTTP POST`

URL a configurar:

```text
https://TU_URL_NGROK/webhooks/twilio/incoming-call
```

## Paso 5) Validar inspector de ngrok

Abre en navegador:

```text
http://127.0.0.1:4040
```

Diagrama del inspector:

```text
http://127.0.0.1:4040
  |
  +-- Requests
  |     +-- POST /webhooks/twilio/incoming-call
  |
  +-- Status code
  +-- Request body (From, To, CallSid, AccountSid...)
  +-- Response body (TwiML)
```

## Como saber si funciona

- Ves POST entrante en `:4040`.
- Twilio marca webhook como exitoso.
- Node responde `200` y `Content-Type: text/xml`.

## Si falla, revisa esto

- ngrok esta apagado.
- URL de ngrok cambio y Twilio tiene URL vieja.
- Metodo no es POST.
- Backend Node no esta escuchando en puerto 3000.
- Cuenta trial sin numero verificado.
