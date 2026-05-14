from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.upload_routes import router as upload_router
from app.routes.thermal_cvd_routes import router as thermal_cvd_router, init_thermal_cvd_model

app = FastAPI(
    title="Quantum Materials AI API",
    description="FastAPI backend for material discovery and Bayesian Optimization",
    version="1.0.0"
)

# Allow React Frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """Initialize ML models on startup."""
    print("Starting up... initializing Thermal CVD optimizer")
    init_thermal_cvd_model()

@app.get("/")
def read_root():
    return {"message": "Welcome to Quantum Materials AI API"}

# Include routers
app.include_router(upload_router)
app.include_router(thermal_cvd_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
