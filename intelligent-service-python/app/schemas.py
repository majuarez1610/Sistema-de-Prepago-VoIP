from pydantic import BaseModel, Field


class CallDecisionRequest(BaseModel):
    phone_number: str = Field(..., min_length=8, max_length=20)
    destination_number: str | None = Field(default=None, max_length=20)
    saturated_schedule: bool = False

class CallDecisionResponse(BaseModel):
    decision: str
    reason: str
    user_id: int | None
    current_balance: float
    cost: float
