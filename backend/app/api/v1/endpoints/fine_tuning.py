from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.core.database import get_supabase, SupabaseClient
from app.core.auth import get_current_admin_user
from app.models.fine_tuning import FineTuningJob, TrainingMetrics, ValidationResult, ModelDeployment
from app.services.fine_tuning_service import FineTuningService

router = APIRouter()

# Pydantic models for API
class FineTuningJobCreate(BaseModel):
    name: str
    model_name: str
    base_model: str
    config: dict

class FineTuningJobResponse(BaseModel):
    id: str
    name: str
    status: str
    model_name: str
    base_model: str
    progress: float
    start_time: datetime
    end_time: Optional[datetime]
    model_id: Optional[str]

class TrainingMetricsResponse(BaseModel):
    accuracy: float
    relevance: float
    readability: float
    coherence: float
    legal_accuracy: float
    simplification_score: float
    clause_explanation_score: float
    qa_score: float
    overall_score: float

class ValidationResultResponse(BaseModel):
    query: str
    expected_response: str
    actual_response: str
    accuracy_score: float
    relevance_score: float
    readability_score: float
    test_category: Optional[str]
    difficulty: Optional[str]

class JobStatsResponse(BaseModel):
    total_jobs: int
    completed_jobs: int
    running_jobs: int
    failed_jobs: int
    average_completion_time: Optional[float]
    success_rate: float

@router.get("/jobs", response_model=List[FineTuningJobResponse])
async def get_fine_tuning_jobs(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get all fine-tuning jobs with optional filtering"""
    filters = {}
    if status:
        filters["status"] = status
    
    jobs = await supabase.select(
        "fine_tuning_jobs", 
        filters=filters,
        order_by="-created_at",
        limit=limit,
        offset=skip
    )
    
    return [FineTuningJobResponse(**job) for job in jobs]

@router.get("/jobs/{job_id}", response_model=FineTuningJobResponse)
async def get_fine_tuning_job(
    job_id: str,
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get specific fine-tuning job details"""
    jobs = await supabase.select("fine_tuning_jobs", filters={"id": job_id})
    
    if not jobs:
        raise HTTPException(status_code=404, detail="Fine-tuning job not found")
    
    return FineTuningJobResponse(**jobs[0])

@router.post("/jobs", response_model=FineTuningJobResponse)
async def create_fine_tuning_job(
    job_data: FineTuningJobCreate,
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Create a new fine-tuning job"""
    job = FineTuningJob(
        name=job_data.name,
        model_name=job_data.model_name,
        base_model=job_data.base_model,
        config=job_data.config,
        status="preparing"
    )
    
    created_job = await supabase.insert("fine_tuning_jobs", job.dict())
    
    # Start the fine-tuning process asynchronously
    fine_tuning_service = FineTuningService()
    await fine_tuning_service.start_training(created_job["id"], supabase)
    
    return FineTuningJobResponse(**created_job)

@router.get("/jobs/{job_id}/metrics", response_model=TrainingMetricsResponse)
async def get_job_metrics(
    job_id: str,
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get training metrics for a specific job"""
    metrics = await supabase.select("training_metrics", filters={"job_id": job_id})
    
    if not metrics:
        raise HTTPException(status_code=404, detail="Metrics not found for this job")
    
    return TrainingMetricsResponse(**metrics[0])

@router.get("/jobs/{job_id}/validation", response_model=List[ValidationResultResponse])
async def get_job_validation_results(
    job_id: str,
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get validation results for a specific job"""
    validation_results = await supabase.select("validation_results", filters={"job_id": job_id})
    
    return [ValidationResultResponse(**result) for result in validation_results]

@router.post("/jobs/{job_id}/cancel")
async def cancel_fine_tuning_job(
    job_id: str,
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Cancel a running fine-tuning job"""
    jobs = await supabase.select("fine_tuning_jobs", filters={"id": job_id})
    
    if not jobs:
        raise HTTPException(status_code=404, detail="Fine-tuning job not found")
    
    job = jobs[0]
    if job["status"] not in ["preparing", "training"]:
        raise HTTPException(status_code=400, detail="Job cannot be cancelled in current status")
    
    await supabase.update(
        "fine_tuning_jobs",
        {
            "status": "failed",
            "end_time": datetime.utcnow().isoformat(),
            "logs": job["logs"] + f"\nJob cancelled by admin {current_admin['username']} at {datetime.utcnow()}"
        },
        {"id": job_id}
    )
    
    return {"message": "Job cancelled successfully"}

@router.get("/stats", response_model=JobStatsResponse)
async def get_fine_tuning_stats(
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get overall fine-tuning statistics"""
    # Get all jobs for statistics
    all_jobs = await supabase.select("fine_tuning_jobs")
    
    total_jobs = len(all_jobs)
    completed_jobs = len([j for j in all_jobs if j["status"] == "completed"])
    running_jobs = len([j for j in all_jobs if j["status"] in ["preparing", "training", "evaluating"]])
    failed_jobs = len([j for j in all_jobs if j["status"] == "failed"])
    
    # Calculate average completion time
    completed_with_times = [j for j in all_jobs if j["status"] == "completed" and j["end_time"]]
    avg_completion_time = None
    if completed_with_times:
        total_time = sum([
            (datetime.fromisoformat(j["end_time"]) - datetime.fromisoformat(j["start_time"])).total_seconds()
            for j in completed_with_times
        ])
        avg_completion_time = total_time / len(completed_with_times)
    
    success_rate = (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0
    
    return JobStatsResponse(
        total_jobs=total_jobs,
        completed_jobs=completed_jobs,
        running_jobs=running_jobs,
        failed_jobs=failed_jobs,
        average_completion_time=avg_completion_time,
        success_rate=success_rate
    )

@router.post("/jobs/{job_id}/deploy")
async def deploy_model(
    job_id: str,
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Deploy a completed fine-tuned model"""
    jobs = await supabase.select("fine_tuning_jobs", filters={"id": job_id})
    
    if not jobs:
        raise HTTPException(status_code=404, detail="Fine-tuning job not found")
    
    job = jobs[0]
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job must be completed before deployment")
    
    # Check if model meets quality threshold
    metrics = await supabase.select("training_metrics", filters={"job_id": job_id})
    
    if not metrics or metrics[0]["overall_score"] < 0.7:
        raise HTTPException(status_code=400, detail="Model quality too low for deployment")
    
    # Create deployment record
    deployment = ModelDeployment(
        job_id=job_id,
        model_endpoint=f"https://api.legaltech.pro/models/{job['model_id']}",
        deployment_status="deploying"
    )
    
    created_deployment = await supabase.insert("model_deployments", deployment.dict())
    
    # In production, trigger actual model deployment here
    await supabase.update(
        "model_deployments",
        {"deployment_status": "active"},
        {"id": created_deployment["id"]}
    )
    
    return {
        "message": "Model deployed successfully",
        "endpoint": deployment.model_endpoint,
        "deployment_id": created_deployment["id"]
    }