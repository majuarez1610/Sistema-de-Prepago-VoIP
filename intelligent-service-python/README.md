# Servicio inteligente Python (SCF)

Este modulo implementa el **Service Control Function (SCF)** del proyecto. Se encarga de aplicar reglas de negocio prepago para decidir si una llamada se autoriza o se rechaza.

## 1) Responsabilidad del modulo

- Recibir solicitudes de decision desde el SSF (Node).
- Consultar estado y saldo del usuario en MySQL.
- Aplicar reglas de autorizacion (`ALLOW_CALL` / `REJECT_CALL`).
- Descontar costo de llamada cuando aplica autorizacion.
- Registrar auditoria de decision en `decision_logs`.

## 2) Requisitos

- Python 3.10+.
- MySQL accesible y con esquema cargado.
- Entorno virtual recomendado para aislamiento.

## 3) Instalacion obligatoria de dependencias

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Dependencias clave:

- `fastapi`, `uvicorn`.
- `sqlalchemy`, `pymysql`.
- `python-dotenv`, `cryptography`, `pydantic`.

## 4) Configuracion

1. Crear entorno local:

```bash
copy .env.example .env
```

2. Configurar `intelligent-service-python/.env`:

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de BD | `root` |
| `DB_PASSWORD` | Password de BD | `` |
| `DB_NAME` | Nombre de base | `intelligent_network_db` |
| `MIN_CALL_COST` | Costo minimo por llamada | `1.00` |

## 5) Ejecucion

```bash
venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verificacion rapida:

- `GET http://localhost:8000/health` debe responder `status: ok`.

## 6) Regla de negocio principal

La decision de llamada sigue esta secuencia:

1. Buscar usuario por `phone_number`.
2. Si no existe: `REJECT_CALL` (usuario no registrado).
3. Si `status != active`: `REJECT_CALL` (usuario inactivo).
4. Si `balance < MIN_CALL_COST`: `REJECT_CALL` (saldo insuficiente).
5. Si cumple reglas: `ALLOW_CALL`, descontar `MIN_CALL_COST` y registrar decision.

## 7) API del modulo

### Endpoint de salud

- `GET /health`

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "intelligent-service-python"
}
```

### Endpoint de decision

- `POST /decision/call`

Entrada esperada:

```json
{
  "phone_number": "+52XXXXXXXXXX",
  "destination_number": "+19012675646"
}
```

Salida ejemplo (`ALLOW_CALL`):

```json
{
  "decision": "ALLOW_CALL",
  "reason": "Usuario activo con saldo suficiente",
  "user_id": 1,
  "current_balance": 9.0,
  "cost": 1.0
}
```

Salida ejemplo (`REJECT_CALL`):

```json
{
  "decision": "REJECT_CALL",
  "reason": "Saldo insuficiente",
  "user_id": 1,
  "current_balance": 0.5,
  "cost": 0.0
}
```

## 8) Errores frecuentes del modulo

| Error/Sintoma | Causa probable | Solucion |
|---|---|---|
| `500 Error en decision inteligente` | Falla de DB o excepcion en reglas | Revisar logs y credenciales `DB_*` |
| Conexion MySQL rechazada | Usuario/password incorrectos | Corregir `.env` y reiniciar servicio |
| Error `caching_sha2_password` | Dependencia de cifrado faltante | Instalar `cryptography` en el `venv` |
| `phone_number es obligatorio` | Payload incompleto | Enviar JSON con `phone_number` valido |
| Rechazos inesperados | Numero no coincide en E.164 | Verificar `users.phone_number` |

## 9) Nota tecnica de entorno

Se utiliza `load_dotenv(override=True)` para priorizar el `.env` local del modulo y evitar heredar variables globales externas (por ejemplo, `DB_USER=postgres`).
