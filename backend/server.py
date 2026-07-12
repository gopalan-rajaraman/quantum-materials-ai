import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

from app.routes.upload_routes import router as upload_router
from app.routes.thermal_cvd_routes import router as thermal_cvd_router, init_thermal_cvd_model
from app.routes.user_routes import router as user_router
from app.database.mongodb_config import MongoDB
from app.email_utils import log_smtp_status
from app.routes.template_routes import router as template_router
from app.routes.experiment_routes import router as experiment_router
from app.routes.dataset_routes import router as dataset_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    log_smtp_status()
    logger.info("Starting up... connecting to MongoDB")
    await MongoDB.connect()
    logger.info("Starting up... initializing Thermal CVD optimizer")
    init_thermal_cvd_model()
    yield
    logger.info("Shutting down... closing MongoDB connection")
    await MongoDB.close()

app = FastAPI(
    title="Quantum Materials AI API",
    description="FastAPI backend for material discovery and Bayesian Optimization",
    version=settings.VERSION,
    lifespan=lifespan
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response

# Allow React Frontend
origins = [
    settings.FRONTEND_URL,
]

if settings.ALLOWED_ORIGINS:
    origins.extend([o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()])

if settings.ENV != 'production':
    # Permissive configuration for local development
    origins.extend(["http://127.0.0.1:5173", "http://localhost:5173"])
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Strict configuration for production
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to Quantum Materials AI API"}

@app.get("/health")
async def health_check():
    health_status = {
        "status": "ok",
        "version": settings.VERSION,
        "environment": settings.ENV,
        "checks": {
            "mongodb": "unknown",
            "env_vars": "ok"
        }
    }
    
    # Check MongoDB connection
    try:
        await MongoDB.client.admin.command('ping')
        health_status["checks"]["mongodb"] = "ok"
    except Exception as e:
        logger.error(f"Health check MongoDB failed: {e}")
        health_status["checks"]["mongodb"] = "failed"
        health_status["status"] = "degraded"
        
    # Check critical env vars
    critical_vars = ["FRONTEND_URL", "MONGODB_URL", "JWT_SECRET_KEY"]
    missing_vars = [var for var in critical_vars if not getattr(settings, var, None)]
    
    if missing_vars:
        health_status["checks"]["env_vars"] = f"missing: {', '.join(missing_vars)}"
        health_status["status"] = "degraded"
        
    status_code = 200 if health_status["status"] == "ok" else 503
    return JSONResponse(status_code=status_code, content=health_status)

@app.get("/ready")
async def readiness_check():
    # Reuse the enhanced health check logic for readiness probes
    return await health_check()

# Include routers
app.include_router(upload_router)
app.include_router(thermal_cvd_router)
app.include_router(user_router)
app.include_router(template_router)
app.include_router(experiment_router)
app.include_router(dataset_router)

if __name__ == "__main__":
    import uvicorn
    reload = settings.ENV != 'production'
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=reload)