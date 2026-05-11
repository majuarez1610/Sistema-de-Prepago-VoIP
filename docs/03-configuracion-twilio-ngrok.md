# Configuracion de Twilio y ngrok

Guia de integracion para exponer el backend local y recibir eventos reales de llamada desde Twilio.

## 1) Objetivo tecnico

Publicar el endpoint local `POST /webhooks/twilio/incoming-call` mediante una URL HTTPS valida para Twilio.

```text
Twilio Voice
   -> HTTPS Webhook
   -> ngrok tunnel
   -> localhost:3000 (Node)
```

## 2) Requisitos previos

- `backend-node` debe estar ejecutandose en puerto `3000`.
- ngrok instalado localmente.
- Cuenta Twilio con numero de voz activo.

## 3) Instalacion y registro de ngrok

### Verificar instalacion

```bash
ngrok version
```

### Registrar authtoken

```bash
ngrok config add-authtoken TU_AUTHTOKEN
```

Sin `authtoken`, la sesion puede tener restricciones y cortes inesperados.

## 4) Apertura del tunel publico

```bash
ngrok http 3000
```

Salida esperada:

```text
Forwarding https://TU_SUBDOMINIO.ngrok-free.app -> http://localhost:3000
```

Conserva la URL HTTPS exacta para configurar Twilio.

## 5) Configuracion en consola Twilio

Ruta sugerida:

1. `Phone Numbers`.
2. Seleccionar numero de voz asignado.
3. Seccion `Voice Configuration`.
4. Campo `A call comes in`.
5. Opcion `Webhook`.
6. Metodo `HTTP POST`.

URL requerida:

```text
https://TU_URL_NGROK/webhooks/twilio/incoming-call
```

## 6) Validacion operativa

### Desde ngrok inspector

Abrir:

```text
http://127.0.0.1:4040
```

Validar en cada request:

- Metodo `POST`.
- Ruta `/webhooks/twilio/incoming-call`.
- Payload con `From`, `To`, `CallSid`, `AccountSid`.
- Respuesta HTTP `200` con `Content-Type: text/xml`.

### Desde backend Node

Validar log:

```text
[TWILIO WEBHOOK] Incoming real call
```

## 7) Errores comunes de esta etapa

| Sintoma | Causa | Solucion |
|---|---|---|
| Twilio no entrega webhook | URL incorrecta o vencida | Copiar nueva URL de ngrok y actualizar Twilio |
| Codigo 404/405 | Ruta o metodo incorrecto | Verificar `POST` y endpoint completo |
| Codigo 502/503 | Node detenido o con fallo | Reiniciar backend y revisar logs |
| No hay trafico en inspector | ngrok apagado o puerto incorrecto | Ejecutar `ngrok http 3000` |
| Error en cuenta trial | Numero origen no verificado | Verificar numero en consola Twilio |

## 8) Recomendaciones para demo

- Reiniciar ngrok antes de la exposicion y actualizar webhook en Twilio.
- Probar `GET http://localhost:3000/health` antes de llamar.
- Tener abierto `http://127.0.0.1:4040` para mostrar evidencia en vivo.
