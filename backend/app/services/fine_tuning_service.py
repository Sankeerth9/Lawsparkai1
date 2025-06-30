import asyncio
import json
from typing import Dict, Any, List
from datetime import datetime
import uuid

from app.core.database import SupabaseClient
from app.models.fine_tuning import FineTuningJob, TrainingMetrics, ValidationResult


class FineTuningService:
    def __init__(self):
        self.training_stages = [
            "Preparing training data...",
            "Initializing model...", 
            "Training epoch 1/3...",
            "Training epoch 2/3...",
            "Training epoch 3/3...",
            "Evaluating model performance...",
            "Running validation tests...",
            "Finalizing model..."
        ]

    async def start_training(self, job_id: str, supabase: SupabaseClient):
        """Start the fine-tuning process for a job"""
        try:
            # Get the job
            jobs = await supabase.select("fine_tuning_jobs", filters={"id": job_id})
            
            if not jobs:
                raise ValueError(f"Job {job_id} not found")
            
            # Update job status
            await supabase.update(
                "fine_tuning_jobs",
                {
                    "status": "training",
                    "start_time": datetime.utcnow().isoformat()
                },
                {"id": job_id}
            )
            
            # Start training process asynchronously
            asyncio.create_task(self._run_training_process(job_id, supabase))
            
        except Exception as e:
            # Update job status to failed
            await supabase.update(
                "fine_tuning_jobs",
                {
                    "status": "failed",
                    "logs": f"Training failed: {str(e)}"
                },
                {"id": job_id}
            )
            raise

    async def _run_training_process(self, job_id: str, supabase: SupabaseClient):
        """Run the actual training process"""
        try:
            # Simulate training progress
            for i, stage in enumerate(self.training_stages):
                progress = (i / len(self.training_stages)) * 80  # 80% for training
                
                # Get current job to append to logs
                jobs = await supabase.select("fine_tuning_jobs", filters={"id": job_id})
                current_logs = jobs[0]["logs"] if jobs else ""
                
                await supabase.update(
                    "fine_tuning_jobs",
                    {
                        "progress": progress,
                        "logs": current_logs + f"\n{datetime.utcnow()}: {stage}"
                    },
                    {"id": job_id}
                )
                
                # Simulate processing time
                await asyncio.sleep(2)
            
            # Move to evaluation phase
            await supabase.update(
                "fine_tuning_jobs",
                {"status": "evaluating", "progress": 80},
                {"id": job_id}
            )
            
            # Run evaluation
            metrics = await self._evaluate_model(job_id, supabase)
            validation_results = await self._run_validation_tests(job_id, supabase)
            
            # Complete the job
            jobs = await supabase.select("fine_tuning_jobs", filters={"id": job_id})
            current_logs = jobs[0]["logs"] if jobs else ""
            
            await supabase.update(
                "fine_tuning_jobs",
                {
                    "status": "completed",
                    "progress": 100,
                    "end_time": datetime.utcnow().isoformat(),
                    "model_id": f"legal-model-{job_id[:8]}",
                    "logs": current_logs + f"\n{datetime.utcnow()}: Training completed successfully"
                },
                {"id": job_id}
            )
            
        except Exception as e:
            jobs = await supabase.select("fine_tuning_jobs", filters={"id": job_id})
            current_logs = jobs[0]["logs"] if jobs else ""
            
            await supabase.update(
                "fine_tuning_jobs",
                {
                    "status": "failed",
                    "end_time": datetime.utcnow().isoformat(),
                    "logs": current_logs + f"\n{datetime.utcnow()}: Training failed: {str(e)}"
                },
                {"id": job_id}
            )

    async def _evaluate_model(self, job_id: str, supabase: SupabaseClient) -> TrainingMetrics:
        """Evaluate the trained model and create metrics"""
        
        # Simulate model evaluation
        await asyncio.sleep(3)
        
        # Generate realistic metrics
        base_score = 0.75 + (hash(job_id) % 20) / 100  # 0.75-0.95 range
        
        metrics = TrainingMetrics(
            job_id=job_id,
            accuracy=min(0.95, base_score + 0.05),
            relevance=min(0.95, base_score + 0.03),
            readability=min(0.95, base_score + 0.08),
            coherence=min(0.95, base_score + 0.02),
            legal_accuracy=min(0.95, base_score + 0.01),
            simplification_score=min(0.95, base_score + 0.06),
            clause_explanation_score=min(0.95, base_score + 0.04),
            qa_score=min(0.95, base_score + 0.07),
            overall_score=base_score,
            training_loss=0.15,
            validation_loss=0.18,
            learning_rate=0.001
        )
        
        await supabase.insert("training_metrics", metrics.dict())
        return metrics

    async def _run_validation_tests(self, job_id: str, supabase: SupabaseClient) -> List[ValidationResult]:
        """Run validation tests on the trained model"""
        
        test_queries = [
            {
                "query": "What does 'liquidated damages' mean in a contract?",
                "expected": "Liquidated damages are a predetermined amount of money that parties agree will be paid if one party breaches the contract...",
                "category": "clause_explanation",
                "difficulty": "medium"
            },
            {
                "query": "Explain this clause in simple terms: 'Time is of the essence'",
                "expected": "This clause means that meeting deadlines is extremely important and required...",
                "category": "simplification", 
                "difficulty": "easy"
            },
            {
                "query": "What should I know about non-compete agreements?",
                "expected": "Non-compete agreements prevent you from working for competitors or starting a competing business...",
                "category": "qa",
                "difficulty": "medium"
            }
        ]
        
        validation_results = []
        
        for test in test_queries:
            # Simulate model response generation
            await asyncio.sleep(1)
            
            # Generate mock response (in production, would call actual model)
            actual_response = f"Generated response for: {test['query']}"
            
            # Calculate scores (simplified)
            base_accuracy = 0.8 + (hash(test['query']) % 15) / 100
            
            result = ValidationResult(
                job_id=job_id,
                query=test["query"],
                expected_response=test["expected"],
                actual_response=actual_response,
                accuracy_score=base_accuracy,
                relevance_score=min(0.95, base_accuracy + 0.05),
                readability_score=min(0.95, base_accuracy + 0.08),
                test_category=test["category"],
                difficulty=test["difficulty"]
            )
            
            validation_results.append(result)
            await supabase.insert("validation_results", result.dict())
        
        return validation_results

    async def get_training_progress(self, job_id: str, supabase: SupabaseClient) -> Dict[str, Any]:
        """Get current training progress for a job"""
        jobs = await supabase.select("fine_tuning_jobs", filters={"id": job_id})
        
        if not jobs:
            raise ValueError(f"Job {job_id} not found")
        
        job = jobs[0]
        
        return {
            "job_id": job_id,
            "status": job["status"],
            "progress": job["progress"],
            "current_stage": self._get_current_stage(job["progress"]),
            "start_time": job["start_time"],
            "estimated_completion": self._estimate_completion_time(job),
            "logs": job["logs"].split('\n')[-10:] if job["logs"] else []  # Last 10 log entries
        }

    def _get_current_stage(self, progress: float) -> str:
        """Get current training stage based on progress"""
        if progress < 10:
            return "Preparing training data..."
        elif progress < 20:
            return "Initializing model..."
        elif progress < 50:
            return "Training in progress..."
        elif progress < 80:
            return "Finalizing training..."
        elif progress < 90:
            return "Evaluating model..."
        elif progress < 100:
            return "Running validation tests..."
        else:
            return "Training completed"

    def _estimate_completion_time(self, job: Dict[str, Any]) -> str:
        """Estimate completion time based on current progress"""
        if job["status"] == "completed":
            return "Completed"
        
        if job["progress"] == 0:
            return "Estimating..."
        
        # Simple estimation based on progress
        start_time = datetime.fromisoformat(job["start_time"])
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        estimated_total = elapsed / (job["progress"] / 100)
        remaining = estimated_total - elapsed
        
        if remaining < 60:
            return f"{int(remaining)} seconds"
        elif remaining < 3600:
            return f"{int(remaining / 60)} minutes"
        else:
            return f"{int(remaining / 3600)} hours"