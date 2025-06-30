from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class DocumentType(str, Enum):
    CONTRACT = "contract"
    CONSTITUTIONAL = "constitutional"
    STATUTE = "statute"
    CASE_LAW = "case_law"
    REGULATION = "regulation"

class Complexity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class PairType(str, Enum):
    SUMMARIZATION = "summarization"
    CLAUSE_EXPLANATION = "clause_explanation"
    QA = "qa"
    RISK_ANALYSIS = "risk_analysis"

class LegalDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    document_type: DocumentType
    jurisdiction: str
    source: Optional[str] = None
    word_count: int
    complexity: Complexity
    domains: Optional[List[str]] = None
    language: str = "en"
    is_processed: bool = False
    is_anonymized: bool = False
    processing_notes: Optional[str] = None
    document_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PromptResponsePair(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prompt: str
    response: str
    pair_type: PairType
    source_document_id: Optional[str] = None
    source_document_title: Optional[str] = None
    quality_score: int = Field(ge=1, le=5)
    is_verified: bool = False
    reviewed_by: Optional[str] = None
    tags: Optional[List[str]] = None
    difficulty: Optional[str] = None
    domain: Optional[str] = None
    used_in_training: bool = False
    training_job_ids: Optional[List[str]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DatasetMetrics(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    total_documents: int = 0
    total_pairs: int = 0
    verified_pairs: int = 0
    type_distribution: Optional[Dict[str, int]] = None
    quality_distribution: Optional[Dict[str, int]] = None
    language_distribution: Optional[Dict[str, int]] = None
    domain_distribution: Optional[Dict[str, int]] = None
    average_prompt_length: float = 0.0
    average_response_length: float = 0.0
    average_quality_score: float = 0.0
    verification_rate: float = 0.0
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    data_version: str = "1.0"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DataProcessingJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_type: str
    status: str = "pending"
    input_documents: Optional[List[str]] = None
    output_pairs: Optional[List[str]] = None
    config: Optional[Dict[str, Any]] = None
    progress: float = 0.0
    total_items: int = 0
    processed_items: int = 0
    failed_items: int = 0
    results: Optional[Dict[str, Any]] = None
    error_log: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)