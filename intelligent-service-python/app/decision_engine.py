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
SATURATED_CALL_COST = Decimal(read_env_value("SATURATED_CALL_COST", "2.00")).quantize(Decimal("0.01"))
LOW_BALANCE_LIMIT = Decimal(read_env_value("LOW_BALANCE_LIMIT", "3.00")).quantize(Decimal("0.01"))


def _quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _build_response(
    decision: str,
    reason: str,
    user_id,
    current_balance: Decimal,
    cost: Decimal,
    balance_alert: str = "NONE",
    alert_message: str = ""
) -> dict:
    return {
        "decision": decision,
        "reason": reason,
        "user_id": user_id,
        "current_balance": float(_quantize_money(current_balance)),
        "cost": float(_quantize_money(cost)),
        "balance_alert": balance_alert,
        "alert_message": alert_message,
    }


def evaluate_call(
    db: Session,
    phone_number: str,
    destination_number: str | None = None,
    saturated_schedule: bool = False
) -> dict:
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

            return _build_response(
                decision="REJECT_CALL",
                reason="Usuario no registrado",
                user_id=None,
                current_balance=Decimal("0.00"),
                cost=Decimal("0.00"),
                balance_alert="USER_NOT_FOUND",
                alert_message="Tu número no está registrado en el sistema.",
            )

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

            return _build_response(
                decision="REJECT_CALL",
                reason="Usuario inactivo",
                user_id=user.id,
                current_balance=balance_before,
                cost=Decimal("0.00"),
                balance_alert="INACTIVE_USER",
                alert_message="Tu usuario está inactivo.",
            )

        if saturated_schedule:
            final_cost = SATURATED_CALL_COST
            rate_reason = f"Tarifa Especial Hora Pico (${SATURATED_CALL_COST})"
        else:
            final_cost = MIN_CALL_COST
            rate_reason = f"Tarifa Regular Estándar (${MIN_CALL_COST})"

        if balance_before <= Decimal("0.00"):
            log = DecisionLog(
                user_id=user.id,
                phone_number=phone_number,
                decision="REJECT_CALL",
                reason="Sin saldo disponible",
                balance_before=balance_before,
                cost=Decimal("0.00"),
            )
            db.add(log)
            db.commit()

            return _build_response(
                decision="REJECT_CALL",
                reason="Sin saldo disponible",
                user_id=user.id,
                current_balance=balance_before,
                cost=Decimal("0.00"),
                balance_alert="NO_BALANCE",
                alert_message="Ya no tienes saldo disponible. Recarga tu cuenta para poder realizar llamadas.",
            )

        if balance_before < final_cost:
            log = DecisionLog(
                user_id=user.id,
                phone_number=phone_number,
                decision="REJECT_CALL",
                reason=f"Saldo insuficiente para {rate_reason}",
                balance_before=balance_before,
                cost=Decimal("0.00"),
            )
            db.add(log)
            db.commit()

            return _build_response(
                decision="REJECT_CALL",
                reason=f"Saldo insuficiente requiere {rate_reason}",
                user_id=user.id,
                current_balance=balance_before,
                cost=Decimal("0.00"),
                balance_alert="NO_BALANCE",
                alert_message="Tu saldo es insuficiente para realizar esta llamada.",
            )

        new_balance = _quantize_money(balance_before - final_cost)
        user.balance = new_balance

        balance_alert = "NONE"
        alert_message = ""
        reason = f"Usuario activo. Procesado con {rate_reason}"

        if new_balance == Decimal("0.00"):
            balance_alert = "NO_BALANCE"
            alert_message = "Tu saldo llegó a cero pesos. Recarga tu cuenta para poder seguir realizando llamadas."
            reason = f"Llamada autorizada con {rate_reason}. Saldo agotado después de esta llamada"

        elif new_balance <= LOW_BALANCE_LIMIT:
            balance_alert = "LOW_BALANCE"
            alert_message = f"Atención. Te estás quedando sin saldo. Tu saldo actual es de {new_balance} pesos."
            reason = f"Llamada autorizada con {rate_reason}. Usuario con saldo bajo"

        log = DecisionLog(
            user_id=user.id,
            phone_number=phone_number,
            decision="ALLOW_CALL",
            reason=reason,
            balance_before=balance_before,
            cost=final_cost,
        )
        db.add(log)
        db.commit()
        db.refresh(user)

        return _build_response(
            decision="ALLOW_CALL",
            reason=reason,
            user_id=user.id,
            current_balance=_quantize_money(Decimal(user.balance)),
            cost=final_cost,
            balance_alert=balance_alert,
            alert_message=alert_message,
        )

    except Exception:
        db.rollback()
        raise