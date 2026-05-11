# Solucion de errores comunes

Guia de diagnostico rapido para incidencias funcionales y tecnicas del sistema prepago VoIP.

## 1) Arbol de diagnostico inicial

```text
No hay audio o la llamada falla
  -> Llegan requests a ngrok?
      -> No: revisar Twilio y tunnel
      -> Si: revisar respuesta de Node
           -> 4xx/5xx: revisar backend
           -> 200 con rechazo: revisar reglas de negocio
```

## 2) Catalogo de errores frecuentes

| Sintoma | Indicador | Causa probable | Accion correctiva |
|---|---|---|---|
| No aparece request en ngrok | `:4040` sin trafico | URL de webhook incorrecta o ngrok apagado | Reiniciar ngrok y actualizar URL en Twilio |
| Webhook responde 400 | Twilio muestra error de solicitud | Campo `From` ausente/invalido | Revisar payload form-urlencoded |
| Webhook responde 500 | Stacktrace en Node | Error interno (DB, parsing, integracion) | Revisar logs y endpoint `/health` |
| Timeout hacia Python | Node tarda y rechaza | SCF caido o `PYTHON_SERVICE_URL` mal | Levantar Python y corregir `.env` |
| Error de conexion MySQL | `ER_ACCESS_DENIED_ERROR` o similar | Usuario/password/DB incorrectos | Verificar variables `DB_*` y esquema |
| Rechazo de llamada | Decision `REJECT_CALL` | Usuario no registrado/inactivo/sin saldo | Validar `users` y `MIN_CALL_COST` |
| Problema de auth MySQL en Python | Error `caching_sha2_password` | Dependencia criptografica faltante | Instalar `cryptography` en `venv` |

## 3) Diagnostico por capas

### Capa de exposicion (Twilio + ngrok)

Checklist:

1. ngrok activo en puerto `3000`.
2. URL HTTPS vigente y copiada completa.
3. Twilio configurado con metodo `HTTP POST`.
4. Ruta exacta `/webhooks/twilio/incoming-call`.

### Capa de orquestacion (Node)

Checklist:

1. `GET http://localhost:3000/health` responde.
2. Estado `mysql` y `python` sin error.
3. Logs incluyen `[TWILIO WEBHOOK] Incoming real call`.

### Capa de decision (Python)

Checklist:

1. `GET http://localhost:8000/health` responde `ok`.
2. `POST /decision/call` no devuelve excepcion.
3. `MIN_CALL_COST` esta bien definido.

### Capa de datos (MySQL)

Checklist:

1. Base `intelligent_network_db` existe.
2. Tablas `users`, `calls`, `decision_logs` existen.
3. Credenciales en `.env` son correctas.

## 4) Errores de formato de telefono

Formato obligatorio de `From` y `users.phone_number`: E.164.

Correcto:

```text
+52XXXXXXXXXX
```

Incorrecto:

```text
52XXXXXXXXXX
(52) XXXXXXXX
52-XXX-XXXX
```

## 5) Interpretacion de decisiones de negocio

| Decision | Motivo esperado |
|---|---|
| `ALLOW_CALL` | Usuario activo con saldo suficiente |
| `REJECT_CALL` | Usuario no registrado |
| `REJECT_CALL` | Usuario inactivo |
| `REJECT_CALL` | Saldo insuficiente |

Si la decision no coincide con lo esperado, revisar `decision_logs.reason`.

## 6) Comandos utiles de verificacion

```bash
curl http://localhost:3000/health
curl http://localhost:8000/health
curl "http://localhost:3000/webhooks/twilio/test?from=%2B52XXXXXXXXXX&to=%2B19012675646"
```

## 7) Prevencion y buenas practicas

- Instalar todas las dependencias antes de ejecutar (`npm install`, `pip install -r requirements.txt`).
- Mantener `.env` por modulo y no depender de variables globales del sistema.
- Validar salud de servicios antes de cada prueba real.
- No versionar secretos ni archivos de entorno.

No subir al repositorio:

- `.env`
- `venv/`
- `node_modules/`
- tokens, passwords o credenciales
