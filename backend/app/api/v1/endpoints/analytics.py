from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.core.database import get_supabase, SupabaseClient
from app.core.auth import get_current_admin_user

router = APIRouter()

# Pydantic models for analytics
class OverviewStats(BaseModel):
    total_documents: int
    total_training_pairs: int
    total_fine_tuning_jobs: int
    active_deployments: int
    success_rate: float
    average_model_score: float

class TrainingTrends(BaseModel):
    date: str
    jobs_started: int
    jobs_completed: int
    average_score: float

class ModelPerformance(BaseModel):
    model_id: str
    model_name: str
    overall_score: float
    accuracy: float
    readability: float
    legal_accuracy: float
    deployment_status: Optional[str]

class DataQualityMetrics(BaseModel):
    total_pairs: int
    verified_pairs: int
    average_quality: float
    quality_distribution: dict
    type_distribution: dict

class SystemHealth(BaseModel):
    active_jobs: int
    failed_jobs_24h: int
    average_processing_time: float
    storage_usage: dict
    error_rate: float

@router.get("/overview", response_model=OverviewStats)
async def get_overview_stats(
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get high-level overview statistics"""
    
    # Get counts for all main entities
    total_documents = await supabase.count("legal_documents")
    total_training_pairs = await supabase.count("prompt_response_pairs")
    total_fine_tuning_jobs = await supabase.count("fine_tuning_jobs")
    active_deployments = await supabase.count("model_deployments", {"deployment_status": "active"})
    
    # Get all jobs for success rate calculation
    all_jobs = await supabase.select("fine_tuning_jobs")
    completed_jobs = len([j for j in all_jobs if j["status"] == "completed"])
    success_rate = (completed_jobs / len(all_jobs) * 100) if all_jobs else 0
    
    # Get all metrics for average score
    all_metrics = await supabase.select("training_metrics")
    average_model_score = sum([m["overall_score"] for m in all_metrics]) / len(all_metrics) if all_metrics else 0
    
    return OverviewStats(
        total_documents=total_documents,
        total_training_pairs=total_training_pairs,
        total_fine_tuning_jobs=total_fine_tuning_jobs,
        active_deployments=active_deployments,
        success_rate=success_rate,
        average_model_score=average_model_score
    )

@router.get("/training-trends", response_model=List[TrainingTrends])
async def get_training_trends(
    days: int = Query(30, description="Number of days to analyze"),
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get training trends over time"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get all jobs and metrics for analysis
    all_jobs = await supabase.select("fine_tuning_jobs")
    all_metrics = await supabase.select("training_metrics")
    
    trends = []
    for i in range(days):
        date = start_date + timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        
        # Jobs started on this date
        jobs_started = len([
            j for j in all_jobs 
            if datetime.fromisoformat(j["start_time"]).date() == date.date()
        ])
        
        # Jobs completed on this date
        jobs_completed = len([
            j for j in all_jobs 
            if j["end_time"] and datetime.fromisoformat(j["end_time"]).date() == date.date() and j["status"] == "completed"
        ])
        
        # Average score for jobs completed on this date
        completed_job_ids = [
            j["id"] for j in all_jobs 
            if j["end_time"] and datetime.fromisoformat(j["end_time"]).date() == date.date() and j["status"] == "completed"
        ]
        
        relevant_metrics = [m for m in all_metrics if m["job_id"] in completed_job_ids]
        average_score = sum([m["overall_score"] for m in relevant_metrics]) / len(relevant_metrics) if relevant_metrics else 0
        
        trends.append(TrainingTrends(
            date=date_str,
            jobs_started=jobs_started,
            jobs_completed=jobs_completed,
            average_score=average_score
        ))
    
    return trends

@router.get("/model-performance", response_model=List[ModelPerformance])
async def get_model_performance(
    limit: int = Query(10, description="Number of top models to return"),
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get top performing models"""
    # Get completed jobs with metrics
    completed_jobs = await supabase.select("fine_tuning_jobs", filters={"status": "completed"})
    all_metrics = await supabase.select("training_metrics")
    all_deployments = await supabase.select("model_deployments")
    
    # Create job-metrics mapping
    metrics_by_job = {m["job_id"]: m for m in all_metrics}
    deployments_by_job = {d["job_id"]: d for d in all_deployments}
    
    models = []
    for job in completed_jobs:
        if job["id"] in metrics_by_job:
            metrics = metrics_by_job[job["id"]]
            deployment = deployments_by_job.get(job["id"])
            
            models.append(ModelPerformance(
                model_id=job["model_id"] or job["id"],
                model_name=job["name"],
                overall_score=metrics["overall_score"],
                accuracy=metrics["accuracy"],
                readability=metrics["readability"],
                legal_accuracy=metrics["legal_accuracy"],
                deployment_status=deployment["deployment_status"] if deployment else None
            ))
    
    # Sort by overall score and limit
    models.sort(key=lambda x: x.overall_score, reverse=True)
    return models[:limit]

@router.get("/data-quality", response_model=DataQualityMetrics)
async def get_data_quality_metrics(
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get data quality metrics"""
    
    # Get all pairs for analysis
    all_pairs = await supabase.select("prompt_response_pairs")
    
    total_pairs = len(all_pairs)
    verified_pairs = len([p for p in all_pairs if p["is_verified"]])
    average_quality = sum([p["quality_score"] for p in all_pairs]) / total_pairs if total_pairs else 0
    
    # Quality distribution
    quality_distribution = {}
    for pair in all_pairs:
        score = str(pair["quality_score"])
        quality_distribution[score] = quality_distribution.get(score, 0) + 1
    
    # Type distribution
    type_distribution = {}
    for pair in all_pairs:
        pair_type = pair["pair_type"]
        type_distribution[pair_type] = type_distribution.get(pair_type, 0) + 1
    
    return DataQualityMetrics(
        total_pairs=total_pairs,
        verified_pairs=verified_pairs,
        average_quality=average_quality,
        quality_distribution=quality_distribution,
        type_distribution=type_distribution
    )

@router.get("/system-health", response_model=SystemHealth)
async def get_system_health(
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get system health metrics"""
    
    # Get all jobs for analysis
    all_jobs = await supabase.select("fine_tuning_jobs")
    
    # Active jobs
    active_jobs = len([j for j in all_jobs if j["status"] in ["preparing", "training", "evaluating"]])
    
    # Failed jobs in last 24 hours
    yesterday = datetime.utcnow() - timedelta(days=1)
    failed_jobs_24h = len([
        j for j in all_jobs 
        if j["status"] == "failed" and datetime.fromisoformat(j["updated_at"]) >= yesterday
    ])
    
    # Average processing time for completed jobs
    completed_jobs = [j for j in all_jobs if j["status"] == "completed" and j["end_time"]]
    if completed_jobs:
        total_time = sum([
            (datetime.fromisoformat(j["end_time"]) - datetime.fromisoformat(j["start_time"])).total_seconds()
            for j in completed_jobs
        ])
        average_processing_time = total_time / len(completed_jobs)
    else:
        average_processing_time = 0
    
    # Mock storage usage (would be real metrics in production)
    storage_usage = {
        "documents": "2.5 GB",
        "models": "15.2 GB", 
        "logs": "500 MB",
        "total": "18.2 GB"
    }
    
    # Error rate (failed jobs / total jobs in last 24h)
    total_jobs_24h = len([
        j for j in all_jobs 
        if datetime.fromisoformat(j["created_at"]) >= yesterday
    ])
    error_rate = (failed_jobs_24h / total_jobs_24h * 100) if total_jobs_24h > 0 else 0
    
    return SystemHealth(
        active_jobs=active_jobs,
        failed_jobs_24h=failed_jobs_24h,
        average_processing_time=average_processing_time,
        storage_usage=storage_usage,
        error_rate=error_rate
    )

@router.get("/performance-comparison")
async def get_performance_comparison(
    model_ids: List[str] = Query(..., description="Model IDs to compare"),
    supabase: SupabaseClient = Depends(get_supabase),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Compare performance between multiple models"""
    
    # Get jobs and metrics for specified models
    jobs = await supabase.select("fine_tuning_jobs", filters={"id": model_ids})
    all_metrics = await supabase.select("training_metrics")
    
    # Create metrics mapping
    metrics_by_job = {m["job_id"]: m for m in all_metrics}
    
    comparison = []
    for job in jobs:
        if job["id"] in metrics_by_job:
            metrics = metrics_by_job[job["id"]]
            comparison.append({
                "model_id": job["id"],
                "model_name": job["name"],
                "metrics": {
                    "overall_score": metrics["overall_score"],
                    "accuracy": metrics["accuracy"],
                    "relevance": metrics["relevance"],
                    "readability": metrics["readability"],
                    "legal_accuracy": metrics["legal_accuracy"],
                    "simplification_score": metrics["simplification_score"],
                    "clause_explanation_score": metrics["clause_explanation_score"],
                    "qa_score": metrics["qa_score"]
                },
                "training_config": job["config"]
            })
    
    return {
        "models": comparison,
        "comparison_date": datetime.utcnow().isoformat()
    }