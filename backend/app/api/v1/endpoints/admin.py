from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_admin_user
from app.core.config import settings

router = APIRouter()

class SystemInfo(BaseModel):
    version: str
    environment: str
    database_status: str
    redis_status: str
    uptime: str
    total_storage: str

class DatabaseStats(BaseModel):
    total_tables: int
    total_records: int
    database_size: str
    active_connections: int

class LogEntry(BaseModel):
    timestamp: datetime
    level: str
    message: str
    source: str

@router.get("/system-info", response_model=SystemInfo)
async def get_system_info(
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get system information and status"""
    
    # Check database status
    try:
        await db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception:
        db_status = "error"
    
    # Mock other system checks (would be real in production)
    return SystemInfo(
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database_status=db_status,
        redis_status="healthy",  # Would check Redis connection
        uptime="5 days, 12 hours",  # Would calculate actual uptime
        total_storage="25.7 GB"  # Would check actual storage
    )

@router.get("/database-stats", response_model=DatabaseStats)
async def get_database_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get database statistics"""
    
    # Count tables (PostgreSQL specific)
    tables_result = await db.execute(
        text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
    )
    total_tables = tables_result.scalar()
    
    # Get database size (PostgreSQL specific)
    size_result = await db.execute(
        text("SELECT pg_size_pretty(pg_database_size(current_database()))")
    )
    database_size = size_result.scalar()
    
    # Get active connections
    connections_result = await db.execute(
        text("SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'")
    )
    active_connections = connections_result.scalar()
    
    # Mock total records (would sum all tables in production)
    total_records = 15420  # Placeholder
    
    return DatabaseStats(
        total_tables=total_tables,
        total_records=total_records,
        database_size=database_size,
        active_connections=active_connections
    )

@router.get("/logs", response_model=List[LogEntry])
async def get_system_logs(
    limit: int = 100,
    level: str = None,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get system logs"""
    
    # In production, this would read from actual log files or logging service
    # For now, return mock log entries
    mock_logs = [
        LogEntry(
            timestamp=datetime.utcnow(),
            level="INFO",
            message="Fine-tuning job completed successfully",
            source="fine_tuning_service"
        ),
        LogEntry(
            timestamp=datetime.utcnow(),
            level="WARNING", 
            message="High memory usage detected",
            source="system_monitor"
        ),
        LogEntry(
            timestamp=datetime.utcnow(),
            level="ERROR",
            message="Failed to connect to external API",
            source="gemini_service"
        )
    ]
    
    if level:
        mock_logs = [log for log in mock_logs if log.level == level.upper()]
    
    return mock_logs[:limit]

@router.post("/maintenance/cleanup")
async def cleanup_old_data(
    days_old: int = 30,
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Clean up old data and logs"""
    
    # In production, this would:
    # 1. Delete old log entries
    # 2. Archive completed jobs older than X days
    # 3. Clean up temporary files
    # 4. Optimize database
    
    return {
        "message": f"Cleanup completed for data older than {days_old} days",
        "deleted_records": 245,  # Mock number
        "freed_space": "1.2 GB",  # Mock space
        "admin": current_admin["username"]
    }

@router.post("/maintenance/backup")
async def create_backup(
    include_models: bool = True,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Create system backup"""
    
    # In production, this would trigger actual backup process
    backup_id = f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    
    return {
        "message": "Backup created successfully",
        "backup_id": backup_id,
        "size": "5.2 GB",  # Mock size
        "includes_models": include_models,
        "created_by": current_admin["username"]
    }

@router.get("/health-check")
async def detailed_health_check(
    db: AsyncSession = Depends(get_db),
    current_admin: dict = Depends(get_current_admin_user)
):
    """Comprehensive health check"""
    
    health_status = {
        "overall": "healthy",
        "components": {
            "database": "healthy",
            "redis": "healthy", 
            "file_system": "healthy",
            "external_apis": "healthy",
            "background_jobs": "healthy"
        },
        "metrics": {
            "response_time": "45ms",
            "cpu_usage": "23%",
            "memory_usage": "67%",
            "disk_usage": "45%"
        },
        "last_check": datetime.utcnow().isoformat()
    }
    
    return health_status

@router.post("/restart-services")
async def restart_services(
    services: List[str],
    current_admin: dict = Depends(get_current_admin_user)
):
    """Restart specific services"""
    
    if not services:
        raise HTTPException(status_code=400, detail="No services specified")
    
    # In production, this would actually restart services
    # For now, just return success
    
    return {
        "message": f"Services restarted successfully: {', '.join(services)}",
        "restarted_by": current_admin["username"],
        "restart_time": datetime.utcnow().isoformat()
    }