# Mapeo academico a UIT-T Q.1200

## Diagrama general de Red Inteligente

```text
                  SERVICE PLANE
   "Servicio prepago VoIP con control de saldo"

                       |
                       v

            GLOBAL FUNCTIONAL PLANE
   SIB + BCP + POI + POR (logica de servicio)

                       |
                       v

         DISTRIBUTED FUNCTIONAL PLANE
   SSF (Node) <---- IF/REST ----> SCF (Python)
        |                               |
        +----------- consulta ----------+
                        |
                        v
                     SDF (MySQL)

                       |
                       v

               PHYSICAL PLANE
 Celular -> Twilio SSP/IP -> ngrok -> Node -> Python -> MySQL
```

## Tabla de equivalencias

| Concepto Q.1200 | En este proyecto | Que hace |
|---|---|---|
| SSP/IP | Twilio Voice | Punto de entrada de llamada real |
| SSF | Node.js Express | Recibe webhook y dispara logica de servicio |
| SCF | Python FastAPI | Toma decision inteligente |
| SDF | MySQL | Guarda datos de usuario y decisiones |
| IF | HTTP REST | Interfaz Node <-> Python |
| SIB | Bloque logico de validacion | Verificar usuario, estado y saldo |
| BCP | Flujo de control base | Secuencia de autorizacion/rechazo |
| POI | Inicio del proceso | Llega llamada a Twilio |
| POR | Retorno del proceso | TwiML de respuesta de voz |

## Que esta pasando aqui

- **POI**: inicia cuando el usuario real llama al numero Twilio.
- **BCP**: Node toma evento y ejecuta logica de control.
- **SIB**: Python valida reglas del servicio prepago.
- **SDF**: MySQL provee y actualiza informacion.
- **POR**: Node responde TwiML para que Twilio reproduzca audio.

## Ejemplo de ciclo funcional

```text
POI: entra llamada de +52XXXXXXXXXX
 -> SSF (Node) recibe webhook
 -> IF (REST) consulta SCF
 -> SCF verifica en SDF
 -> decision = ALLOW_CALL o REJECT_CALL
 -> POR: SSF devuelve TwiML a SSP/IP (Twilio)
 -> Twilio reproduce audio
```

## Como saber si el mapeo si se ve en la demo

- Si hay webhook real, POI y SSF estan activos.
- Si Python responde decision, SCF e IF estan activos.
- Si MySQL registra `decision_logs` y `calls`, SDF esta activo.
- Si el usuario escucha mensaje, POR se completo.
