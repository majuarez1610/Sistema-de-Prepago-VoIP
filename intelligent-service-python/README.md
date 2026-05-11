# Servicio inteligente Python (SCF)

Este servicio representa el **SCF (Service Control Function)** y decide si una llamada se autoriza o rechaza.

## Requisitos

- Python 3.10+
- MySQL en ejecucion

## Configuracion

1. Copia `.env.example` a `.env`.
2. Ajusta credenciales locales de MySQL.
3. Verifica que `MIN_CALL_COST` tenga el costo minimo por llamada.

## Instalacion y ejecucion

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoint principal

- `POST /decision/call`

Entrada:

```json
{
  "phone_number": "+52XXXXXXXXXX",
  "destination_number": "+19012675646"
}
```

Salida ejemplo:

```json
{
  "decision": "ALLOW_CALL",
  "reason": "Usuario activo con saldo suficiente",
  "user_id": 1,
  "current_balance": 9.0,
  "cost": 1.0
}
```

## Nota importante

Se utiliza `load_dotenv(override=True)` para evitar tomar variables globales externas como `DB_USER=postgres`.
