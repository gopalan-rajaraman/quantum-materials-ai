from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routes.upload_routes import router as upload_router
from app.routes.thermal_cvd_routes import router as thermal_cvd_router, init_thermal_cvd_model
from app.routes.dataset_routes import router as dataset_routes
from app.routes.user_routes import router as user_router
from app.database.mongodb_config import MongoDB

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    # Startup
    print("Starting up... connecting to MongoDB")
    await MongoDB.connect()
    print("Starting up... initializing Thermal CVD optimizer")
    init_thermal_cvd_model()
    yield
    # Shutdown
    print("Shutting down... closing MongoDB connection")
    await MongoDB.close()

app = FastAPI(
    title="Quantum Materials AI API",
    description="FastAPI backend for material discovery and Bayesian Optimization",
    version="1.0.0",
    lifespan=lifespan
)

# Allow React Frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
]

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

# Include routers
app.include_router(upload_router)
app.include_router(thermal_cvd_router)
# app.include_router(dataset_router)
app.include_router(user_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
