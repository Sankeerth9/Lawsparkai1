from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.core.database import get_supabase, SupabaseClient
from app.core.auth import get_current_admin_user
from app.models.data_preparation import LegalDocument, PromptResponsePair, DatasetMetrics, DataProcessingJob
from app.services.data_preparation_service import DataPreparationService

router = APIRouter()

# Pydantic models
class LegalDocumentResponse(BaseModel):
    id: str
    title: str
    document_type: str
    jurisdiction: str
    word_count: int
    complexity: str
    language: str
    is_processed: bool
    is_anonymized: bool
    created_at: datetime

class PromptResponsePairResponse(BaseModel):
    id: str
    prompt: str
    response: str
    pair_type: str
    quality_score: int
    is_verified: bool
    domain: Optional[str]
    difficulty: Optional[str]
    created_at: datetime

class DatasetMetricsResponse(BaseModel):
    total_documents: int
    total_pairs: int
    verified_pairs: int
    type_distribution: dict
    quality_distribution: dict
    language_distribution: dict
    average_prompt_length: float
    average_response_length: float
    average_quality_score: float
    verification_rate: float
    last_updated: datetime

class DataProcessingJobResponse(BaseModel):
    id: str
    job_type: str
    status: str
    progress: float
    total_items: int
    processed_items: int
    failed_items: int
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    created_at: datetime

@router.get("/documents", response_model=List[LegalDocumentResponse])
async def get_legal_documents(
    skip: int = 0,
    limit: int = 100,
    document_type: Optional[str] = None,
    jurisdiction: Optional[str] = None,
    is_processed: Optional[bool] = None,
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get legal documents with optional filtering"""
    filters = {}
    if document_type:
        filters["document_type"] = document_type
    if jurisdiction:
        filters["jurisdiction"] = jurisdiction
    if is_processed is not None:
        filters["is_processed"] = is_processed
    
    documents = await supabase.select(
        "legal_documents",
        filters=filters,
        order_by="-created_at",
        limit=limit,
        offset=skip
    )
    
    return [LegalDocumentResponse(**doc) for doc in documents]

@router.post("/documents/upload")
async def upload_legal_document(
    file: UploadFile = File(...),
    document_type: str = "contract",
    jurisdiction: str = "US",
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Upload and process a legal document"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Read file content
    content = await file.read()
    text_content = content.decode('utf-8')
    
    # Create document record
    document = LegalDocument(
        title=file.filename,
        content=text_content,
        document_type=document_type,
        jurisdiction=jurisdiction,
        word_count=len(text_content.split()),
        complexity="medium",  # Would be calculated by service
        language="en",
        source="upload"
    )
    
    created_document = await supabase.insert("legal_documents", document.dict())
    
    # Start processing job
    data_service = DataPreparationService()
    job_id = await data_service.start_document_processing(created_document["id"], supabase)
    
    return {
        "message": "Document uploaded successfully",
        "document_id": created_document["id"],
        "processing_job_id": job_id
    }

@router.get("/pairs", response_model=List[PromptResponsePairResponse])
async def get_prompt_response_pairs(
    skip: int = 0,
    limit: int = 100,
    pair_type: Optional[str] = None,
    is_verified: Optional[bool] = None,
    min_quality: Optional[int] = None,
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get prompt-response pairs with optional filtering"""
    filters = {}
    if pair_type:
        filters["pair_type"] = pair_type
    if is_verified is not None:
        filters["is_verified"] = is_verified
    
    pairs = await supabase.select(
        "prompt_response_pairs",
        filters=filters,
        order_by="-created_at",
        limit=limit,
        offset=skip
    )
    
    # Filter by quality if specified (Supabase doesn't support >= in simple filters)
    if min_quality:
        pairs = [p for p in pairs if p["quality_score"] >= min_quality]
    
    return [PromptResponsePairResponse(**pair) for pair in pairs]

@router.post("/pairs/generate")
async def generate_training_pairs(
    document_ids: List[str],
    pair_types: List[str] = ["summarization", "clause_explanation", "qa"],
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Generate training pairs from documents"""
    # Validate document IDs
    documents = await supabase.select("legal_documents", filters={"id": document_ids})
    
    if len(documents) != len(document_ids):
        raise HTTPException(status_code=404, detail="Some documents not found")
    
    # Start pair generation job
    data_service = DataPreparationService()
    job_id = await data_service.start_pair_generation(document_ids, pair_types, supabase)
    
    return {
        "message": "Pair generation started",
        "job_id": job_id,
        "documents_count": len(documents),
        "pair_types": pair_types
    }

@router.get("/metrics", response_model=DatasetMetricsResponse)
async def get_dataset_metrics(
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get current dataset metrics"""
    # Get latest metrics record
    metrics = await supabase.select("dataset_metrics", order_by="-last_updated", limit=1)
    
    if not metrics:
        # Calculate metrics if none exist
        data_service = DataPreparationService()
        calculated_metrics = await data_service.calculate_dataset_metrics(supabase)
        return DatasetMetricsResponse(**calculated_metrics.dict())
    
    return DatasetMetricsResponse(**metrics[0])

@router.post("/metrics/refresh")
async def refresh_dataset_metrics(
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Recalculate and update dataset metrics"""
    data_service = DataPreparationService()
    metrics = await data_service.calculate_dataset_metrics(supabase)
    
    return {
        "message": "Metrics refreshed successfully",
        "metrics": DatasetMetricsResponse(**metrics.dict())
    }

@router.get("/jobs", response_model=List[DataProcessingJobResponse])
async def get_processing_jobs(
    skip: int = 0,
    limit: int = 50,
    job_type: Optional[str] = None,
    status: Optional[str] = None,
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get data processing jobs"""
    filters = {}
    if job_type:
        filters["job_type"] = job_type
    if status:
        filters["status"] = status
    
    jobs = await supabase.select(
        "data_processing_jobs",
        filters=filters,
        order_by="-created_at",
        limit=limit,
        offset=skip
    )
    
    return [DataProcessingJobResponse(**job) for job in jobs]

@router.post("/anonymize")
async def anonymize_documents(
    document_ids: List[str],
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Start anonymization process for documents"""
    data_service = DataPreparationService()
    job_id = await data_service.start_anonymization(document_ids, supabase)
    
    return {
        "message": "Anonymization started",
        "job_id": job_id,
        "document_count": len(document_ids)
    }

@router.post("/export")
async def export_dataset(
    format: str = "jsonl",
    pair_types: Optional[List[str]] = None,
    min_quality: int = 3,
    verified_only: bool = False,
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Export training dataset"""
    if format not in ["jsonl", "csv"]:
        raise HTTPException(status_code=400, detail="Format must be 'jsonl' or 'csv'")
    
    data_service = DataPreparationService()
    export_data = await data_service.export_dataset(
        supabase, format, pair_types, min_quality, verified_only
    )
    
    return {
        "message": "Dataset exported successfully",
        "format": format,
        "size": len(export_data),
        "data": export_data[:1000] if len(export_data) > 1000 else export_data  # Limit response size
    }