from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
from dotenv import load_dotenv, dotenv_values
from sqlalchemy.orm import Session
from .models import User, DecisionLog


ENV_PATH = Path(__file__).resolve().parent.parent / ".env"

load_dotenv(dotenv_path=ENV_PATH, override=True)
ENV_VALUES = dotenv_values(ENV_PATH) if ENV_PATH.exists() else {}


def read_env_value(key: str, fallback: str) -> str:
    if key in ENV_VALUES and ENV_VALUES[key] is not None:
        return str(ENV_VALUES[key])
    return fallback

MIN_CALL_COST = Decimal(read_env_value("MIN_CALL_COST", "1.00")).quantize(Decimal("0.01"))


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def evaluate_call(db: Session, phone_number: str, destination_number: str | None = None, saturated_schedule: bool = False) -> dict:
    try:
        user = (
            db.query(User)
            .filter(User.phone_number == phone_number)
            .with_for_update()
            .first()
        )

        if user is None:
            log = DecisionLog(
                user_id=None,
                phone_number=phone_number,
                decision="REJECT_CALL",
                reason="Usuario no registrado",
                balance_before=Decimal("0.00"),
                cost=Decimal("0.00"),
            )
            db.add(log)
            db.commit()
            return {
                "decision": "REJECT_CALL",
                "reason": "Usuario no registrado",
                "user_id": None,
                "current_balance": 0.00,
                "cost": 0.00,
            }

        balance_before = _quantize_money(Decimal(user.balance))

        if user.status != "active":
            log = DecisionLog(
                user_id=user.id,
                phone_number=phone_number,
                decision="REJECT_CALL",
                reason="Usuario inactivo",
                balance_before=balance_before,
                cost=Decimal("0.00"),
            )
            db.add(log)
            db.commit()
            return {
                "decision": "REJECT_CALL",
                "reason": "Usuario inactivo",
                "user_id": user.id,
                "current_balance": float(balance_before),
                "cost": 0.00,
            }
        
        if saturated_schedule:
            FINAL_COST = Decimal("2.00")
            razon_tarifa = "Tarifa Especial Hora Pico ($2.00)"

        else:
            FINAL_COST = MIN_CALL_COST
            razon_tarifa = f"Tarifa Regular Estándar (${MIN_CALL_COST})"   

        if balance_before < FINAL_COST:
            log = DecisionLog(
                user_id=user.id,
                phone_number=phone_number,
                decision="REJECT_CALL",
                reason=f"Saldo insuficiente para {razon_tarifa}",
                balance_before=balance_before,
                cost=Decimal("0.00"),
            )
            db.add(log)
            db.commit()
            return {
                "decision": "REJECT_CALL",
                "reason": f"Saldo insuficiente requiere {razon_tarifa}",
                "user_id": user.id,
                "current_balance": float(balance_before),
                "cost": 0.00,
            }

        new_balance = _quantize_money(balance_before - FINAL_COST)
        user.balance = new_balance

        log = DecisionLog(
            user_id=user.id,
            phone_number=phone_number,
            decision="ALLOW_CALL",
            reason=f"Llamada autorizada con {razon_tarifa}",
            balance_before=balance_before,
            cost=FINAL_COST,
        )
        db.add(log)
        db.commit()
        db.refresh(user)

        return {
            "decision": "ALLOW_CALL",
            "reason": f"Usuario activo. Procesado con {razon_tarifa}",
            "user_id": user.id,
            "current_balance": float(_quantize_money(Decimal(user.balance))),
            "cost": float(FINAL_COST),
        }
    except Exception:
        db.rollback()
        raise
