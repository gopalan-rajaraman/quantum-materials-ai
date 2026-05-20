"""
MongoDB data models for BO Loop application.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from bson import ObjectId


class PyObjectId(str):
    """Custom ObjectId for Pydantic models (Pydantic v2 compatible)."""
    
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        """Pydantic v2 core schema method."""
        from pydantic_core import core_schema
        
        return core_schema.with_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.plain_serializer_function_ser_schema(
                str,
                return_schema=core_schema.str_schema(),
                info_arg=False,
            ),
        )
    
    @classmethod
    def validate(cls, v):
        """Validate ObjectId."""
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)


class UserModel(BaseModel):
    """User model for authentication and account management."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    full_name: str
    email: str
    department: str = ""
    institute: str = ""
    role: str = "user"  # user, admin, student, researcher, professor, etc.
    password_hash: str
    is_verified: bool = False
    verification_token: Optional[str] = None
    member_since: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }


class DatasetModel(BaseModel):
    """Dataset model for storing experiment datasets."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    description: str = ""
    user_id: Optional[PyObjectId] = None
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

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }


class ExperimentModel(BaseModel):
    """Individual experiment model."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    dataset_id: Optional[PyObjectId] = None
    experiment_id: str
    status: str = "planned"  # planned, running, completed, failed
    parameters: Dict[str, Any] = {}  # GTE, GTI, FRA, Pressure, etc.
    results: Optional[Dict[str, Any]] = None  # PL_FWHM, PL_Peak, morphology, etc.
    notes: str = ""
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    completed_at: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }


class ActivityLogModel(BaseModel):
    """Activity log for tracking user actions."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: Optional[PyObjectId] = None
    title: str
    description: str
    color: str = "bg-cyan-500"
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }


class BORecommendationModel(BaseModel):
    """Bayesian Optimization recommendation record."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    dataset_id: Optional[PyObjectId] = None
    parameters: Dict[str, Any] = {}  # Recommended parameters
    predicted_fwhm: float
    uncertainty: float
    ei_value: float
    bo_step: int
    executed: bool = False
    experiment_id: Optional[PyObjectId] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }
