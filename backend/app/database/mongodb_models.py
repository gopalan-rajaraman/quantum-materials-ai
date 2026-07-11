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
    auth_providers: list[str] = Field(default_factory=lambda: ["local"])
    google_id: Optional[str] = None
    password_hash: Optional[str] = None
    is_verified: bool = False
    verification_token: Optional[str] = None
    member_since: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    active_dataset_id: Optional[PyObjectId] = None

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
    status: str = "ready"  # uploading, processing, ready, optimizing, archived, deleted
    experiment_id_range: str = ""
    total_experiments: int = 0
    numerical_constants: Dict[str, Any] = {}
    categorical_constants: Dict[str, Any] = {}
    variables_to_vary: List[Dict[str, Any]] = []
    minimum_runs_required: int = 0
    total_planned_runs: int = 0
    column_mapping: Dict[str, str] = {}  # Store the mapping that was actually used
    optimizer_config: Dict[str, Any] = {}
    optimizer_version: str = "v1"
    statistics: Dict[str, Any] = {}
    last_bo_run: Optional[str] = None
    deleted_at: Optional[str] = None
    lock_owner: Optional[str] = None
    lock_acquired_at: Optional[str] = None
    lock_expires_at: Optional[str] = None
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
    experiment_number: int = 1
    type: str = "historical"  # historical, bo
    schema_version: int = 1
    status: str = "completed"  # pending, running, completed, failed
    parameters: Dict[str, Any] = {}  # GTE, GTI, FRA, Pressure, etc.
    results: Optional[Dict[str, Any]] = None  # PL_FWHM, PL_Peak, morphology, etc.
    predicted_value: Optional[float] = None
    actual_value: Optional[float] = None
    uncertainty: Optional[float] = None
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


class DatasetEventModel(BaseModel):
    """Audit trail for dataset events."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    dataset_id: PyObjectId
    event_type: str  # Dataset uploaded, BO started, etc.
    details: Dict[str, Any] = {}
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

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


class ImportTemplateModel(BaseModel):
    """Reusable import templates for dataset uploads."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    experiment_id: str
    user_id: Optional[PyObjectId] = None
    mapping_json: Dict[str, str] = {}
    version: int = 1
    is_default: bool = False
    created_by: Optional[str] = None
    last_used_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    times_used: int = 0
    notes: str = ""
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }


class ImportSessionModel(BaseModel):
    """Session for tracking a dataset import process between parse and confirm phases."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: Optional[PyObjectId] = None
    experiment_id: Optional[str] = None
    file_path: str  # Path to the temporarily saved file
    original_filename: str
    columns: List[str] = []
    preview: List[Dict[str, Any]] = []
    duplicate_headers: List[str] = []
    detected_types: Dict[str, str] = {}
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    expires_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat()) # Should be set to future

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }
