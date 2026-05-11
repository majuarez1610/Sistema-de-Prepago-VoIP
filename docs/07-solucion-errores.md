# Solucion de errores comunes

## Mapa rapido de diagnostico

```text
No suena audio en llamada real
   |
   +--> No hay request en ngrok? -> revisar Twilio URL / ngrok
   |
   +--> Hay request en ngrok pero error? -> revisar Node logs
   |
   +--> Node consulta y rechaza? -> revisar users/saldo/status en MySQL
   |
   +--> Error MySQL? -> revisar .env y credenciales
```

## Tabla de fallas y accion

| Sintoma | Posible causa | Que revisar |
|---|---|---|
| No llega nada a ngrok | URL mal en Twilio o ngrok apagado | `https://TU_URL_NGROK/...`, `ngrok http 3000` |
| Llega a ngrok pero responde 500 | Node caido o error interno | logs Node, `GET /health` |
| Node responde REJECT_CALL | Usuario/saldo/estado no valido | tabla `users` y `MIN_CALL_COST` |
| Error DB_USER=postgres | Variables globales contaminan entorno | `.env` local + override habilitado |
| Python no conecta a MySQL | Driver/credenciales | `pymysql`, `cryptography`, `.env` |

## A) La llamada no llega a ngrok

1. Confirma que ngrok esta activo en puerto 3000.
2. Confirma URL HTTPS actual de ngrok.
3. En Twilio, verifica metodo `HTTP POST`.
4. Revisa `http://127.0.0.1:4040`.

## B) Llega a ngrok pero falla Node

1. Revisa consola de Node.
2. Verifica `GET http://localhost:3000/health`.
3. Verifica `backend-node/.env`.

## C) Llega a Node pero el numero no coincide

Formato obligatorio E.164.

Correcto:

```text
+52XXXXXXXXXX
```

Incorrecto:

```text
52XXXXXXXXXX
(52) XXXXX
52-XXX-XXX
```

## D) Se registra REJECT_CALL

Que puede significar:
- usuario no registrado,
- usuario inactivo,
- saldo insuficiente.

Como comprobar:
- tabla `users`,
- tabla `decision_logs`,
- `MIN_CALL_COST` en Python `.env`.

## Variables globales conflictivas

- Python usa `load_dotenv(override=True)` y carga `.env` local.
- Node usa `dotenv` con `path` explicito y `override: true`.

Esto evita heredar accidentalmente valores globales como `DB_USER=postgres`.

## Error `caching_sha2_password`

Instala dependencia en entorno Python:

```bash
pip install cryptography
```

## Seguridad del repositorio

No subir nunca:
- `.env`
- `venv/`
- `node_modules/`
- tokens, contrasenas o credenciales
