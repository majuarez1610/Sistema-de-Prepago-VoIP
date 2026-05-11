# Sistema de Prepago VoIP con Red Inteligente

Proyecto academico-profesional para demostrar un servicio de voz prepago basado en arquitectura de Red Inteligente. El criterio principal de validacion es una llamada real desde celular fisico hacia Twilio, con decision en tiempo real y respuesta de voz via TwiML.

## 1) Objetivo

Autorizar o rechazar llamadas entrantes segun reglas de negocio:

- `ALLOW_CALL`: usuario registrado, activo y con saldo suficiente.
- `REJECT_CALL`: usuario no registrado, inactivo o sin saldo.

## 2) Alcance funcional

- Control de acceso de llamada por saldo prepago.
- Registro persistente de llamadas y decisiones.
- Integracion real con webhook de Twilio (no solo simulacion local).
- Visualizacion de usuarios, llamadas y decisiones en panel React.

## 3) Arquitectura general

```text
Celular fisico
   -> Numero Twilio (Voice)
   -> Webhook HTTP POST (via ngrok)
   -> Node.js Express (SSF)
   -> Python FastAPI (SCF)
   -> MySQL (SDF)
   -> Node genera TwiML
   -> Twilio reproduce audio al usuario real
```

| Componente | Rol | Responsabilidad |
|---|---|---|
| Twilio Voice | SSP/IP | Entrada de llamada real y envio de webhook |
| Node.js Express | SSF | Orquestacion, consulta SCF, persistencia en `calls`, respuesta TwiML |
| Python FastAPI | SCF | Evaluacion de reglas y descuento de saldo |
| MySQL | SDF | Persistencia de `users`, `calls`, `recharges`, `decision_logs` |
| HTTP REST | IF | Interfaz Node <-> Python |
| React + Vite | Panel | Monitoreo operativo del sistema |

## 4) Requisitos previos

- Node.js 18+ y npm.
- Python 3.10+.
- MySQL 8+.
- ngrok instalado y con `authtoken`.
- Cuenta Twilio con numero de voz configurado.

## 5) Instalacion obligatoria de dependencias

Debes instalar todas las dependencias en cada modulo antes de ejecutar el sistema.

### Backend Node (SSF)

```bash
cd backend-node
npm install
```

### Servicio inteligente Python (SCF)

```bash
cd intelligent-service-python
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend React

```bash
cd frontend-react
npm install
```

## 6) Configuracion de variables de entorno

Crear archivo `.env` en cada modulo tomando como base su `.env.example`.

### `backend-node/.env`

| Variable | Uso |
|---|---|
| `PORT` | Puerto de Node (`3000`) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexion a MySQL |
| `PYTHON_SERVICE_URL` | URL del SCF (`http://localhost:8000`) |

### `intelligent-service-python/.env`

| Variable | Uso |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexion a MySQL |
| `MIN_CALL_COST` | Costo minimo por llamada para autorizacion |

### `frontend-react/.env`

| Variable | Uso |
|---|---|
| `VITE_API_URL` | URL base del backend (`http://localhost:3000`) |

## 7) Flujo operativo del proyecto

1. Crear base y tablas con `database/schema.sql`.
2. Insertar datos iniciales con `database/seed.example.sql` y actualizar numero real en formato E.164 (`+52XXXXXXXXXX`).
3. Iniciar SCF Python en `8000`.
4. Iniciar SSF Node en `3000`.
5. Iniciar frontend React.
6. Exponer Node con `ngrok http 3000`.
7. Configurar Twilio en `A call comes in` con metodo `HTTP POST` y URL:

```text
https://TU_URL_NGROK/webhooks/twilio/incoming-call
```

## 8) Flujo de decision en llamada real

1. Usuario llama desde celular al numero Twilio.
2. Twilio envia `From`, `To`, `CallSid`, `CallStatus`, `Direction`, `AccountSid` al webhook.
3. Node procesa el evento y consulta `POST /decision/call` en Python.
4. Python evalua reglas y responde `ALLOW_CALL` o `REJECT_CALL`.
5. Node guarda la llamada en MySQL (`calls`) y responde TwiML (`text/xml`).
6. Twilio reproduce mensaje de autorizacion o rechazo al usuario.

## 9) Evidencia de funcionamiento

- En `http://127.0.0.1:4040` aparece el `POST /webhooks/twilio/incoming-call`.
- En logs de Node aparece `[TWILIO WEBHOOK] Incoming real call` y la decision final.
- En MySQL se insertan registros en `calls` y `decision_logs`.
- En React se visualizan llamadas y decisiones recientes.

## 10) Errores que puede presentar el sistema

### Errores funcionales de negocio

| Resultado | Causa |
|---|---|
| `REJECT_CALL` | Usuario no registrado |
| `REJECT_CALL` | Usuario inactivo |
| `REJECT_CALL` | Saldo insuficiente (`balance < MIN_CALL_COST`) |

### Errores tecnicos frecuentes

| Sintoma | Causa probable | Accion sugerida |
|---|---|---|
| No llega webhook a ngrok | URL vieja o ngrok apagado | Actualizar URL en Twilio y reiniciar ngrok |
| Respuesta 400 en webhook | Campo `From` ausente | Revisar payload en inspector de ngrok |
| Respuesta 500 en backend | Error interno Node o DB | Revisar logs y `GET /health` |
| Python no responde | SCF detenido o `PYTHON_SERVICE_URL` incorrecta | Levantar Python y validar URL |
| Error de MySQL | Credenciales incorrectas o DB no creada | Verificar `.env` y ejecutar `schema.sql` |
| Twilio rechaza llamadas en trial | Numero no verificado | Verificar numero origen en consola Twilio |

## 11) Prueba principal y pruebas secundarias

- Prueba principal (obligatoria): llamada real desde celular al numero Twilio.
- Pruebas secundarias (soporte): `GET /webhooks/twilio/test` y `POST` manual del webhook.
- Las pruebas secundarias sirven para depuracion, pero no sustituyen la prueba principal.

## 12) Estructura de documentacion

- `docs/01-arquitectura.md`
- `docs/02-red-inteligente-uit-q1200.md`
- `docs/03-configuracion-twilio-ngrok.md`
- `docs/04-ejecucion-local.md`
- `docs/05-pruebas-llamada-real.md`
- `docs/06-pruebas-consola-secundarias.md`
- `docs/07-solucion-errores.md`
