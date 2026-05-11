from fastapi import FastAPI
from .routes import router


app = FastAPI(title="Sistema Inteligente SCF")
app.include_router(router)


@app.get("/")
def root():
    return {
        "message": "Servicio inteligente de prepago VoIP (SCF)",
        "docs": "/docs"
    }
