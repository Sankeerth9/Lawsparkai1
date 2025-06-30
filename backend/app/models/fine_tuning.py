from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class JobStatus(str, Enum):
    PREPARING = "preparing"
    TRAINING = "training"
    EVALUATING = "evaluating"
    COMPLETED = "completed"
    FAILED = "failed"

class BaseModel(str, Enum):
    GEMINI_FLASH = "gemini-1.5-flash"
    GEMINI_PRO = "gemini-1.5-pro"

class FineTuningJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    status: JobStatus = JobStatus.PREPARING
    model_name: str
    base_model: BaseModel
    config: Dict[str, Any]
    progress: float = 0.0
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    model_id: Optional[str] = None
    logs: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TrainingMetrics(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    accuracy: float
    relevance: float
    readability: float
    coherence: float
    legal_accuracy: float
    simplification_score: float
    clause_explanation_score: float
    qa_score: float
    overall_score: float
    training_loss: Optional[float] = None
    validation_loss: Optional[float] = None
    learning_rate: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ValidationResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    query: str
    expected_response: str
    actual_response: str
    accuracy_score: float
    relevance_score: float
    readability_score: float
    test_category: Optional[str] = None
    difficulty: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ModelDeployment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    model_endpoint: str
    deployment_status: str = "deploying"
    total_requests: int = 0
    average_latency: float = 0.0
    error_rate: float = 0.0
    uptime_percentage: float = 0.0
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    deployed_at: datetime = Field(default_factory=datetime.utcnow)
    last_health_check: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)