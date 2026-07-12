from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    ENV: str = "development"
    VERSION: str = "1.0.0"
    
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    
    MONGODB_URL: str
    DATABASE_NAME: str = "bo_loop_db"
    
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str
    FROM_NAME: str = "Quantum Materials AI"
    FROM_EMAIL: str
    
    FRONTEND_URL: str
    BACKEND_URL: str = "http://localhost:8000"
    ALLOWED_ORIGINS: str = ""
    GOOGLE_CLIENT_ID: str
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

# Instantiate globally to be imported across the app
settings = Settings()
