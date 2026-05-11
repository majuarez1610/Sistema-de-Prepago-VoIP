# Ejecucion local

## Diagrama de terminales

```text
Terminal 1  -> Python SCF (puerto 8000)
Terminal 2  -> Node.js SSF (puerto 3000)
Terminal 3  -> ngrok (tunel publico a 3000)
Terminal 4  -> React (panel web)
```

## Paso 1) Preparar MySQL

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.example.sql
```

Que esta pasando aqui:
- Se crean tablas `users`, `recharges`, `calls`, `decision_logs`.
- Se inserta un usuario minimo de ejemplo.

Importante:
- Edita `database/seed.example.sql` para usar tu numero real en formato E.164 (`+52XXXXXXXXXX`).

## Paso 2) Levantar SCF en Python (Terminal 1)

```bash
cd intelligent-service-python
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Como saber si funciona:
- Abre `http://localhost:8000/health` y debe responder `status: ok`.

## Paso 3) Levantar SSF en Node (Terminal 2)

```bash
cd backend-node
npm install
copy .env.example .env
npm run dev
```

Como saber si funciona:
- Abre `http://localhost:3000/health`.

## Paso 4) Abrir tunel ngrok (Terminal 3)

```bash
ngrok config add-authtoken TU_AUTHTOKEN
ngrok http 3000
```

Como saber si funciona:
- Ver URL HTTPS publica en salida de ngrok.
- Inspector disponible en `http://127.0.0.1:4040`.

## Paso 5) Levantar panel React (Terminal 4)

```bash
cd frontend-react
npm install
copy .env.example .env
npm run dev
```

Como saber si funciona:
- Abrir URL de Vite (normalmente `http://localhost:5173`).

## Paso 6) Configurar Twilio

Webhook de entrada de llamada:

```text
https://TU_URL_NGROK/webhooks/twilio/incoming-call
```

Metodo: `HTTP POST`.

## Si falla, revisa esto

- `GET /health` de Node no responde: Node no inicio o puerto ocupado.
- Python no responde: entorno virtual no activo o dependencias faltantes.
- MySQL rechaza acceso: ajustar `DB_USER` y `DB_PASSWORD` en `.env`.
- No llega llamada: Twilio no tiene URL ngrok actualizada.
