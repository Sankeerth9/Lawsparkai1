# Legal AI Backend with Supabase

A FastAPI-based backend for the Legal Technology Platform with AI/ML capabilities for fine-tuning legal language models and data preparation, powered by Supabase.

## Features

- **FastAPI Framework**: Modern, fast web framework for building APIs
- **Supabase Integration**: Real-time database, authentication, and storage
- **Docker Containerization**: Easy deployment and development
- **AI/ML Pipeline**: Fine-tuning capabilities for legal language models
- **Data Preparation**: Legal document processing and anonymization
- **Admin Dashboard**: Comprehensive admin API for monitoring and management
- **Security**: JWT authentication, rate limiting, and security headers

## Architecture

```
├── app/
│   ├── api/v1/endpoints/     # API route handlers
│   ├── core/                 # Core configuration and utilities
│   ├── models/               # Pydantic models for data validation
│   ├── services/             # Business logic services
│   └── main.py              # FastAPI application entry point
├── docker-compose.yml       # Docker setup
├── Dockerfile              # Backend container definition
└── requirements.txt        # Python dependencies
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Supabase account and project
- Python 3.11+ (for local development)

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. In your Supabase dashboard, go to Settings > API to get your:
   - Project URL
   - Anon key
   - Service role key

3. Create the required tables by running this SQL in the Supabase SQL editor:

```sql
-- Fine-tuning tables
CREATE TABLE fine_tuning_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'preparing',
    model_name TEXT NOT NULL,
    base_model TEXT NOT NULL,
    config JSONB NOT NULL,
    progress FLOAT DEFAULT 0.0,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    model_id TEXT,
    logs TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES fine_tuning_jobs(id) ON DELETE CASCADE,
    accuracy FLOAT NOT NULL,
    relevance FLOAT NOT NULL,
    readability FLOAT NOT NULL,
    coherence FLOAT NOT NULL,
    legal_accuracy FLOAT NOT NULL,
    simplification_score FLOAT NOT NULL,
    clause_explanation_score FLOAT NOT NULL,
    qa_score FLOAT NOT NULL,
    overall_score FLOAT NOT NULL,
    training_loss FLOAT,
    validation_loss FLOAT,
    learning_rate FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE validation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES fine_tuning_jobs(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    expected_response TEXT NOT NULL,
    actual_response TEXT NOT NULL,
    accuracy_score FLOAT NOT NULL,
    relevance_score FLOAT NOT NULL,
    readability_score FLOAT NOT NULL,
    test_category TEXT,
    difficulty TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE model_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES fine_tuning_jobs(id) ON DELETE CASCADE,
    model_endpoint TEXT NOT NULL,
    deployment_status TEXT DEFAULT 'deploying',
    total_requests INTEGER DEFAULT 0,
    average_latency FLOAT DEFAULT 0.0,
    error_rate FLOAT DEFAULT 0.0,
    uptime_percentage FLOAT DEFAULT 0.0,
    cpu_usage FLOAT DEFAULT 0.0,
    memory_usage FLOAT DEFAULT 0.0,
    deployed_at TIMESTAMPTZ DEFAULT NOW(),
    last_health_check TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data preparation tables
CREATE TABLE legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    document_type TEXT NOT NULL,
    jurisdiction TEXT NOT NULL,
    source TEXT,
    word_count INTEGER NOT NULL,
    complexity TEXT NOT NULL,
    domains JSONB,
    language TEXT DEFAULT 'en',
    is_processed BOOLEAN DEFAULT FALSE,
    is_anonymized BOOLEAN DEFAULT FALSE,
    processing_notes TEXT,
    document_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prompt_response_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    pair_type TEXT NOT NULL,
    source_document_id UUID REFERENCES legal_documents(id) ON DELETE SET NULL,
    source_document_title TEXT,
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
    is_verified BOOLEAN DEFAULT FALSE,
    reviewed_by TEXT,
    tags JSONB,
    difficulty TEXT,
    domain TEXT,
    used_in_training BOOLEAN DEFAULT FALSE,
    training_job_ids JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dataset_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_documents INTEGER DEFAULT 0,
    total_pairs INTEGER DEFAULT 0,
    verified_pairs INTEGER DEFAULT 0,
    type_distribution JSONB,
    quality_distribution JSONB,
    language_distribution JSONB,
    domain_distribution JSONB,
    average_prompt_length FLOAT DEFAULT 0.0,
    average_response_length FLOAT DEFAULT 0.0,
    average_quality_score FLOAT DEFAULT 0.0,
    verification_rate FLOAT DEFAULT 0.0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    data_version TEXT DEFAULT '1.0',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE data_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    input_documents JSONB,
    output_pairs JSONB,
    config JSONB,
    progress FLOAT DEFAULT 0.0,
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    results JSONB,
    error_log TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE fine_tuning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_response_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_processing_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for service role)
CREATE POLICY "Allow all for service role" ON fine_tuning_jobs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow all for service role" ON training_metrics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow all for service role" ON validation_results FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow all for service role" ON model_deployments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow all for service role" ON legal_documents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow all for service role" ON prompt_response_pairs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow all for service role" ON dataset_metrics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow all for service role" ON data_processing_jobs FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX idx_fine_tuning_jobs_status ON fine_tuning_jobs(status);
CREATE INDEX idx_fine_tuning_jobs_created_at ON fine_tuning_jobs(created_at);
CREATE INDEX idx_legal_documents_type ON legal_documents(document_type);
CREATE INDEX idx_prompt_response_pairs_type ON prompt_response_pairs(pair_type);
CREATE INDEX idx_prompt_response_pairs_quality ON prompt_response_pairs(quality_score);
CREATE INDEX idx_data_processing_jobs_status ON data_processing_jobs(status);
```

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
GEMINI_API_KEY=your-gemini-api-key-here
SECRET_KEY=your-secret-key-change-in-production
ADMIN_PASSWORD=your-secure-admin-password
```

### Docker Deployment (Recommended)

1. Start the backend:
```bash
docker-compose up -d
```

2. Check service health:
```bash
docker-compose ps
```

3. View logs:
```bash
docker-compose logs -f backend
```

4. Access the API:
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health
- Admin Login: POST http://localhost:8000/api/v1/auth/login

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Start the development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Admin login
- `POST /api/v1/auth/token` - OAuth2 token endpoint

### Fine-Tuning Management
- `GET /api/v1/fine-tuning/jobs` - List fine-tuning jobs
- `POST /api/v1/fine-tuning/jobs` - Create new fine-tuning job
- `GET /api/v1/fine-tuning/jobs/{job_id}` - Get job details
- `GET /api/v1/fine-tuning/jobs/{job_id}/metrics` - Get training metrics
- `POST /api/v1/fine-tuning/jobs/{job_id}/cancel` - Cancel job
- `POST /api/v1/fine-tuning/jobs/{job_id}/deploy` - Deploy model

### Data Preparation
- `GET /api/v1/data-preparation/documents` - List legal documents
- `POST /api/v1/data-preparation/documents/upload` - Upload document
- `GET /api/v1/data-preparation/pairs` - List training pairs
- `POST /api/v1/data-preparation/pairs/generate` - Generate training pairs
- `GET /api/v1/data-preparation/metrics` - Get dataset metrics
- `POST /api/v1/data-preparation/anonymize` - Anonymize documents
- `POST /api/v1/data-preparation/export` - Export dataset

### Analytics
- `GET /api/v1/analytics/overview` - System overview stats
- `GET /api/v1/analytics/training-trends` - Training trends over time
- `GET /api/v1/analytics/model-performance` - Top performing models
- `GET /api/v1/analytics/data-quality` - Data quality metrics
- `GET /api/v1/analytics/system-health` - System health status

### Admin
- `GET /api/v1/admin/system-info` - System information
- `GET /api/v1/admin/database-stats` - Database statistics
- `GET /api/v1/admin/logs` - System logs
- `POST /api/v1/admin/maintenance/cleanup` - Clean up old data
- `POST /api/v1/admin/maintenance/backup` - Create backup

## Supabase Integration

### Database Tables

- **fine_tuning_jobs**: Training job management
- **training_metrics**: Model performance metrics
- **validation_results**: Model validation test results
- **legal_documents**: Legal document storage
- **prompt_response_pairs**: Training data pairs
- **dataset_metrics**: Dataset quality metrics
- **data_processing_jobs**: Background job tracking
- **model_deployments**: Model deployment tracking

### Key Features

- **Real-time Updates**: Supabase provides real-time subscriptions
- **Row Level Security**: Secure data access with RLS policies
- **UUID Primary Keys**: For better security and distribution
- **JSONB Fields**: Flexible metadata and configuration storage
- **Indexes**: Optimized for common query patterns
- **Foreign Keys**: Referential integrity enforcement

### Services

#### Fine-Tuning Service
Manages the complete fine-tuning lifecycle:
- Training data preparation
- Model training orchestration
- Performance evaluation
- Model validation
- Deployment management

#### Data Preparation Service
Handles legal document processing:
- Document ingestion and parsing
- Sensitive data anonymization
- Training pair generation
- Quality assessment
- Dataset export

## Security

### Authentication
- JWT-based authentication
- Admin role-based access control
- Token expiration and refresh

### Data Protection
- Automatic PII anonymization
- GDPR/CCPA compliance features
- Secure file upload handling
- Rate limiting on API endpoints
- Supabase Row Level Security

### Infrastructure Security
- Docker container isolation
- Nginx reverse proxy with security headers
- SSL/TLS support (production)
- Supabase built-in security features

## Monitoring & Logging

### Health Checks
- Application health endpoint
- Supabase connectivity checks
- Service dependency validation

### Metrics Collection
- Training job statistics
- Data processing metrics
- System performance indicators
- Error rate tracking

### Logging
- Structured JSON logging
- Log level configuration
- Centralized log aggregation ready
- Audit trail for admin actions

## Deployment

### Production Considerations

1. **Environment Variables**: Use secure, production-ready values
2. **SSL Certificates**: Configure HTTPS with valid certificates
3. **Supabase**: Use production Supabase instance
4. **Monitoring**: Integrate with monitoring solutions
5. **Backups**: Supabase handles automated backups

### Scaling

- **Horizontal Scaling**: Multiple backend instances behind load balancer
- **Database Scaling**: Supabase handles scaling automatically
- **Real-time Features**: Supabase provides built-in real-time capabilities
- **Caching**: Implement application-level caching as needed

## Development

### Code Structure
- **Models**: Pydantic models for data validation
- **Services**: Business logic separated from API handlers
- **API Endpoints**: Clean, RESTful API design
- **Configuration**: Environment-based configuration management

### Testing
```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_fine_tuning.py
```

## Troubleshooting

### Common Issues

1. **Supabase Connection**: Check URL and API keys
2. **API Key Issues**: Ensure Gemini API key is valid and set
3. **Permission Errors**: Check file permissions for uploads and data directories
4. **RLS Policies**: Ensure proper Row Level Security policies are set

### Logs
```bash
# View backend logs
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f backend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.