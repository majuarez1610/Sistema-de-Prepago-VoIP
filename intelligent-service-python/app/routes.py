from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .schemas import CallDecisionRequest, CallDecisionResponse
from .decision_engine import evaluate_call


router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "intelligent-service-python"
    }


@router.post("/decision/call", response_model=CallDecisionResponse)
def decide_call(payload: CallDecisionRequest, db: Session = Depends(get_db)):
    if not payload.phone_number:
        raise HTTPException(
            status_code=400,
            detail="phone_number es obligatorio"
        )

    try:
        return evaluate_call(
            db=db,
            phone_number=payload.phone_number,
            destination_number=payload.destination_number,
            saturated_schedule=payload.saturated_schedule
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Error en decision inteligente: {str(exc)}"
        )