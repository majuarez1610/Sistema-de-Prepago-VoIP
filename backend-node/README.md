# Backend Node.js (SSF)

Este modulo implementa el **Service Switching Function (SSF)** del proyecto. Su responsabilidad es recibir el webhook real de Twilio, consultar al SCF en Python para tomar la decision de negocio y responder TwiML al proveedor de voz.

## 1) Responsabilidad del modulo

- Exponer endpoints HTTP para trafico operativo y consultas del panel.
- Procesar eventos de llamada entrante de Twilio (`POST` webhook).
- Invocar al SCF (`POST /decision/call`) para evaluar autorizacion.
- Persistir registros de llamada en MySQL (`calls`).
- Responder TwiML (`text/xml`) para reproduccion de audio en llamada real.

## 2) Requisitos

- Node.js 18+.
- npm.
- MySQL disponible y con esquema creado.
- Servicio Python SCF activo (por defecto en `http://localhost:8000`).

## 3) Instalacion obligatoria de dependencias

```bash
npm install
```

Dependencias principales:

- `express`, `cors`, `dotenv`.
- `mysql2` para acceso a base de datos.
- `axios` para integracion con Python.

## 4) Configuracion

1. Crear archivo de entorno:

```bash
copy .env.example .env
```

2. Definir variables de `backend-node/.env`:

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `PORT` | Puerto HTTP del SSF | `3000` |
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de BD | `root` |
| `DB_PASSWORD` | Password de BD | `root12345` |
| `DB_NAME` | Nombre de base | `intelligent_network_db` |
| `PYTHON_SERVICE_URL` | URL base del SCF | `http://localhost:8000` |

## 5) Ejecucion

### Desarrollo

```bash
npm run dev
```

### Produccion local

```bash
npm start
```

## 6) Flujo interno de llamada

1. Twilio envia `POST /webhooks/twilio/incoming-call`.
2. SSF extrae `From`, `To`, `CallSid`, `CallStatus`, `Direction`, `AccountSid`.
3. SSF consulta al SCF con `POST /decision/call`.
4. SCF responde `ALLOW_CALL` o `REJECT_CALL`.
5. SSF guarda evento en tabla `calls`.
6. SSF retorna TwiML para reproduccion en llamada.

## 7) Endpoints principales

| Endpoint | Metodo | Uso |
|---|---|---|
| `/health` | `GET` | Estado de Node, MySQL y Python |
| `/webhooks/twilio/incoming-call` | `POST` | Flujo principal con Twilio real |
| `/webhooks/twilio/test` | `GET` | Simulacion local de webhook |
| `/api/users` | `GET` | Consulta de usuarios para panel |
| `/api/calls` | `GET` | Consulta de llamadas registradas |
| `/api/decisions` | `GET` | Consulta de decisiones del SCF |

### Payload esperado desde Twilio

`Content-Type: application/x-www-form-urlencoded`

Campos relevantes:

- `From`
- `To`
- `CallSid`
- `CallStatus`
- `Direction`
- `AccountSid`

## 8) Verificacion tecnica

- `GET http://localhost:3000/health` debe responder estado general.
- En logs debe aparecer `[TWILIO WEBHOOK] Incoming real call`.
- En MySQL debe insertarse una fila en `calls` por intento.
- La respuesta del webhook debe ser `200` con `Content-Type: text/xml`.

## 9) Errores frecuentes del modulo

| Sintoma | Causa probable | Accion recomendada |
|---|---|---|
| `500` en webhook | Error interno de Node o DB | Revisar logs y credenciales `DB_*` |
| `400` en webhook | `From` ausente | Revisar payload recibido en ngrok |
| Rechazo automatico | SCF no disponible o timeout | Levantar Python y validar `PYTHON_SERVICE_URL` |
| `mysql access denied` | Usuario/password incorrectos | Corregir `.env` y reiniciar Node |
| Sin trafico real | ngrok/Twilio mal configurados | Actualizar webhook en Twilio |

## 10) Pruebas rapidas

### Prueba secundaria (simulacion GET)

```bash
curl "http://localhost:3000/webhooks/twilio/test?from=%2B52XXXXXXXXXX&to=%2B19012675646"
```

### Prueba secundaria (POST manual)

```bash
curl -X POST "http://localhost:3000/webhooks/twilio/incoming-call" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=%2B52XXXXXXXXXX&To=%2B19012675646&CallSid=CA_TEST&CallStatus=ringing&Direction=inbound-api&AccountSid=AC_TEST"
```

Estas pruebas no sustituyen la validacion principal con llamada real desde celular.
