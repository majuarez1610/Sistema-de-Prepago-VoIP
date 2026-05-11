# Ejecucion local completa

Este documento describe la puesta en marcha end-to-end del sistema para entorno de desarrollo y demostracion academica.

## 1) Topologia de ejecucion

```text
Terminal 1 -> Python SCF (8000)
Terminal 2 -> Node SSF (3000)
Terminal 3 -> ngrok (tunnel -> 3000)
Terminal 4 -> React panel (5173)
```

## 2) Paso previo obligatorio: instalar dependencias

Antes de correr el sistema, instala dependencias en todos los modulos.

### Python

```bash
cd intelligent-service-python
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Node backend

```bash
cd backend-node
npm install
```

### React frontend

```bash
cd frontend-react
npm install
```

## 3) Preparar base de datos MySQL

1. Crear estructura:

```bash
mysql -u root -p < database/schema.sql
```

2. Cargar datos de ejemplo:

```bash
mysql -u root -p < database/seed.example.sql
```

3. Editar `database/seed.example.sql` con numero real en formato E.164 (`+52XXXXXXXXXX`).

## 4) Configurar archivos `.env`

### Backend Node

```bash
cd backend-node
copy .env.example .env
```

Completar credenciales de MySQL y `PYTHON_SERVICE_URL`.

### Servicio Python

```bash
cd intelligent-service-python
copy .env.example .env
```

Completar credenciales de MySQL y `MIN_CALL_COST`.

### Frontend React

```bash
cd frontend-react
copy .env.example .env
```

Definir `VITE_API_URL` hacia Node (`http://localhost:3000`).

## 5) Iniciar servicios

### Terminal 1: Python SCF

```bash
cd intelligent-service-python
venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Validar salud: `http://localhost:8000/health`.

### Terminal 2: Node SSF

```bash
cd backend-node
npm run dev
```

Validar salud: `http://localhost:3000/health`.

### Terminal 3: ngrok

```bash
ngrok config add-authtoken TU_AUTHTOKEN
ngrok http 3000
```

Guardar URL HTTPS publica.

### Terminal 4: React

```bash
cd frontend-react
npm run dev
```

Abrir URL de Vite (normalmente `http://localhost:5173`).

## 6) Configurar webhook Twilio

En el numero de Twilio, `A call comes in`:

- Tipo: `Webhook`.
- Metodo: `HTTP POST`.
- URL:

```text
https://TU_URL_NGROK/webhooks/twilio/incoming-call
```

## 7) Flujo esperado al ejecutar

1. Twilio entrega webhook a Node via ngrok.
2. Node consulta Python para decision.
3. Python consulta MySQL y responde.
4. Node guarda llamada y responde TwiML.
5. Twilio reproduce audio segun decision.

## 8) Checklist de validacion minima

- `GET /health` en Python responde `ok`.
- `GET /health` en Node muestra `node: ok`, `mysql: ok`, `python: ok`.
- ngrok inspector (`http://127.0.0.1:4040`) recibe POST real.
- Existen inserciones nuevas en `calls` y `decision_logs`.

## 9) Fallas frecuentes en ejecucion local

| Sintoma | Diagnostico rapido | Accion |
|---|---|---|
| Python no levanta | Entorno virtual o dependencias faltantes | Reactivar `venv` e instalar `requirements.txt` |
| Node no conecta DB | Variables `.env` incorrectas | Revisar `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` |
| Node no conecta Python | URL SCF incorrecta | Corregir `PYTHON_SERVICE_URL` |
| No llega trafico de Twilio | ngrok apagado o URL obsoleta | Reiniciar ngrok y actualizar webhook |
