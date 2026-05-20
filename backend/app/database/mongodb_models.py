"""
MongoDB data models for BO Loop application.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId for Pydantic models."""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


class UserModel(BaseModel):
    """User model for authentication and account management."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    full_name: str
    email: str
    password_hash: str
    role: str = "user"  # user, admin
    member_since: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class DatasetModel(BaseModel):
    """Dataset model for storing experiment datasets."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    description: str = ""
    user_id: PyObjectId
    status: str = "unlocked"  # unlocked, in_progress, locked
    experiment_id_range: str = ""
    total_experiments: int = 0
    numerical_constants: Dict[str, Any] = {}
    categorical_constants: Dict[str, Any] = {}
    variables_to_vary: List[Dict[str, Any]] = []
    minimum_runs_required: int = 0
    total_planned_runs: int = 0
    data: List[Dict[str, Any]] = []  # Actual experiment data
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ExperimentModel(BaseModel):
    """Individual experiment model."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    dataset_id: PyObjectId
    experiment_id: str
    status: str = "planned"  # planned, running, completed, failed
    parameters: Dict[str, Any] = {}  # GTE, GTI, FRA, Pressure, etc.
    results: Optional[Dict[str, Any]] = None  # PL_FWHM, PL_Peak, morphology, etc.
    notes: str = ""
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    completed_at: Optional[str] = None

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ActivityLogModel(BaseModel):
    """Activity log for tracking user actions."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: Optional[PyObjectId] = None
    title: str
    description: str
    color: str = "bg-cyan-500"
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class BORecommendationModel(BaseModel):
    """Bayesian Optimization recommendation record."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    dataset_id: PyObjectId
    parameters: Dict[str, Any] = {}  # Recommended parameters
    predicted_fwhm: float
    uncertainty: float
    ei_value: float
    bo_step: int
    executed: bool = False
    experiment_id: Optional[PyObjectId] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
