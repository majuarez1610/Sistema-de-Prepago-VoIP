from sqlalchemy import Column, Integer, String, Enum, DECIMAL, TIMESTAMP, text
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=False, unique=True, index=True)
    balance = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    status = Column(Enum("active", "inactive", name="users_status_enum"), nullable=False, default="active")
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP")
    )


class DecisionLog(Base):
    __tablename__ = "decision_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    phone_number = Column(String(20), nullable=False, index=True)
    decision = Column(Enum("ALLOW_CALL", "REJECT_CALL", name="decision_logs_decision_enum"), nullable=False)
    reason = Column(String(255), nullable=False)
    balance_before = Column(DECIMAL(10, 2), nullable=False)
    cost = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
