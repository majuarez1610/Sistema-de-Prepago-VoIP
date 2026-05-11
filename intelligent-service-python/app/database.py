from pathlib import Path
from dotenv import load_dotenv, dotenv_values
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


ENV_PATH = Path(__file__).resolve().parent.parent / ".env"

load_dotenv(dotenv_path=ENV_PATH, override=True)
ENV_VALUES = dotenv_values(ENV_PATH) if ENV_PATH.exists() else {}


def read_env_value(key: str, fallback: str) -> str:
    if key in ENV_VALUES and ENV_VALUES[key] is not None:
        return str(ENV_VALUES[key])
    return fallback

DB_HOST = read_env_value("DB_HOST", "localhost")
DB_PORT = read_env_value("DB_PORT", "3306")
DB_USER = read_env_value("DB_USER", "root")
DB_PASSWORD = read_env_value("DB_PASSWORD", "")
DB_NAME = read_env_value("DB_NAME", "intelligent_network_db")

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
