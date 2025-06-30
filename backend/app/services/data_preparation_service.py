import asyncio
import json
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from app.core.database import SupabaseClient
from app.models.data_preparation import (
    LegalDocument, 
    PromptResponsePair, 
    DatasetMetrics, 
    DataProcessingJob
)


class DataPreparationService:
    def __init__(self):
        self.sensitive_patterns = [
            (r'\b\d{3}-\d{2}-\d{4}\b', '[SSN_REDACTED]'),  # SSN
            (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL_REDACTED]'),  # Email
            (r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE_REDACTED]'),  # Phone
            (r'\b\d{1,5}\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b', '[ADDRESS_REDACTED]'),  # Address
            (r'\$[\d,]+(?:\.\d{2})?', '[AMOUNT_REDACTED]'),  # Dollar amounts
        ]

    async def start_document_processing(self, document_id: str, supabase: SupabaseClient) -> str:
        """Start processing a legal document"""
        job = DataProcessingJob(
            job_type="document_processing",
            status="running",
            input_documents=[document_id],
            total_items=1,
            start_time=datetime.utcnow()
        )
        
        created_job = await supabase.insert("data_processing_jobs", job.dict())
        
        # Start processing asynchronously
        asyncio.create_task(self._process_document(created_job["id"], document_id, supabase))
        
        return created_job["id"]

    async def _process_document(self, job_id: str, document_id: str, supabase: SupabaseClient):
        """Process a single document"""
        try:
            # Get document
            documents = await supabase.select("legal_documents", filters={"id": document_id})
            
            if not documents:
                raise ValueError(f"Document {document_id} not found")
            
            document = documents[0]
            
            # Update progress
            await supabase.update(
                "data_processing_jobs",
                {"progress": 25.0},
                {"id": job_id}
            )
            
            # Anonymize content
            anonymized_content = self._anonymize_content(document["content"])
            
            # Update progress
            await supabase.update(
                "data_processing_jobs",
                {"progress": 50.0},
                {"id": job_id}
            )
            
            # Analyze complexity and domains
            complexity = self._assess_complexity(anonymized_content)
            domains = self._extract_domains(anonymized_content)
            
            # Update progress
            await supabase.update(
                "data_processing_jobs",
                {"progress": 75.0},
                {"id": job_id}
            )
            
            # Update document
            await supabase.update(
                "legal_documents",
                {
                    "content": anonymized_content,
                    "complexity": complexity,
                    "domains": domains,
                    "is_processed": True,
                    "is_anonymized": True,
                    "processing_notes": "Automatically processed and anonymized"
                },
                {"id": document_id}
            )
            
            # Complete job
            await supabase.update(
                "data_processing_jobs",
                {
                    "status": "completed",
                    "progress": 100.0,
                    "processed_items": 1,
                    "end_time": datetime.utcnow().isoformat(),
                    "results": {"anonymized": True, "complexity": complexity, "domains": domains}
                },
                {"id": job_id}
            )
            
        except Exception as e:
            await supabase.update(
                "data_processing_jobs",
                {
                    "status": "failed",
                    "end_time": datetime.utcnow().isoformat(),
                    "error_log": str(e)
                },
                {"id": job_id}
            )

    def _anonymize_content(self, content: str) -> str:
        """Anonymize sensitive data in content"""
        anonymized = content
        
        for pattern, replacement in self.sensitive_patterns:
            anonymized = re.sub(pattern, replacement, anonymized, flags=re.IGNORECASE)
        
        # Additional name anonymization
        anonymized = self._anonymize_names(anonymized)
        
        return anonymized

    def _anonymize_names(self, text: str) -> str:
        """Anonymize person names in text"""
        # Simple name pattern matching
        name_patterns = [
            r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',  # First Last
            r'\b(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+[A-Z][a-z]+\b',  # Title Name
        ]
        
        result = text
        for pattern in name_patterns:
            result = re.sub(pattern, '[NAME_REDACTED]', result)
        
        return result

    def _assess_complexity(self, content: str) -> str:
        """Assess document complexity"""
        word_count = len(content.split())
        sentences = content.split('.')
        avg_sentence_length = word_count / len(sentences) if sentences else 0
        
        # Simple complexity assessment
        if avg_sentence_length > 25 or word_count > 5000:
            return "high"
        elif avg_sentence_length > 15 or word_count > 2000:
            return "medium"
        else:
            return "low"

    def _extract_domains(self, content: str) -> List[str]:
        """Extract legal domains from content"""
        domains = []
        content_lower = content.lower()
        
        domain_keywords = {
            "employment": ["employment", "employee", "employer", "workplace", "salary", "benefits"],
            "contracts": ["contract", "agreement", "terms", "conditions", "obligations"],
            "intellectual_property": ["copyright", "trademark", "patent", "intellectual property"],
            "privacy": ["privacy", "data protection", "confidential", "personal information"],
            "liability": ["liability", "damages", "negligence", "responsibility"],
            "real_estate": ["property", "real estate", "lease", "rental", "mortgage"],
            "corporate": ["corporation", "company", "business", "shareholders", "board"]
        }
        
        for domain, keywords in domain_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                domains.append(domain)
        
        return domains if domains else ["general"]

    async def start_pair_generation(self, document_ids: List[str], pair_types: List[str], supabase: SupabaseClient) -> str:
        """Start generating training pairs from documents"""
        job = DataProcessingJob(
            job_type="pair_generation",
            status="running",
            input_documents=document_ids,
            total_items=len(document_ids) * len(pair_types),
            start_time=datetime.utcnow(),
            config={"pair_types": pair_types}
        )
        
        created_job = await supabase.insert("data_processing_jobs", job.dict())
        
        # Start generation asynchronously
        asyncio.create_task(self._generate_pairs(created_job["id"], document_ids, pair_types, supabase))
        
        return created_job["id"]

    async def _generate_pairs(self, job_id: str, document_ids: List[str], pair_types: List[str], supabase: SupabaseClient):
        """Generate training pairs from documents"""
        try:
            generated_pairs = []
            processed_items = 0
            
            for doc_id in document_ids:
                # Get document
                documents = await supabase.select("legal_documents", filters={"id": doc_id})
                
                if not documents:
                    continue
                
                document = documents[0]
                
                for pair_type in pair_types:
                    # Generate pairs based on type
                    pairs = await self._generate_pairs_for_type(document, pair_type)
                    
                    for pair_data in pairs:
                        pair = PromptResponsePair(
                            prompt=pair_data["prompt"],
                            response=pair_data["response"],
                            pair_type=pair_type,
                            source_document_id=doc_id,
                            source_document_title=document["title"],
                            quality_score=pair_data.get("quality_score", 3),
                            domain=document["domains"][0] if document["domains"] else "general",
                            difficulty=pair_data.get("difficulty", "medium"),
                            tags=pair_data.get("tags", [])
                        )
                        
                        created_pair = await supabase.insert("prompt_response_pairs", pair.dict())
                        generated_pairs.append(created_pair["id"])
                    
                    processed_items += 1
                    progress = (processed_items / (len(document_ids) * len(pair_types))) * 100
                    
                    await supabase.update(
                        "data_processing_jobs",
                        {"progress": progress, "processed_items": processed_items},
                        {"id": job_id}
                    )
            
            # Complete job
            await supabase.update(
                "data_processing_jobs",
                {
                    "status": "completed",
                    "progress": 100.0,
                    "end_time": datetime.utcnow().isoformat(),
                    "output_pairs": generated_pairs,
                    "results": {"generated_pairs": len(generated_pairs), "pair_types": pair_types}
                },
                {"id": job_id}
            )
            
        except Exception as e:
            await supabase.update(
                "data_processing_jobs",
                {
                    "status": "failed",
                    "end_time": datetime.utcnow().isoformat(),
                    "error_log": str(e)
                },
                {"id": job_id}
            )

    async def _generate_pairs_for_type(self, document: Dict[str, Any], pair_type: str) -> List[Dict[str, Any]]:
        """Generate specific type of training pairs"""
        pairs = []
        
        if pair_type == "summarization":
            pairs.extend([
                {
                    "prompt": f"Provide a comprehensive summary of this {document['document_type']}:\n\n{document['content'][:1000]}...",
                    "response": f"This {document['document_type']} outlines key legal provisions and obligations...",
                    "quality_score": 4,
                    "difficulty": "medium",
                    "tags": ["summary", document["document_type"]]
                },
                {
                    "prompt": f"Give me a brief overview of this legal document:\n\n{document['content'][:500]}...",
                    "response": f"Brief overview: This document establishes...",
                    "quality_score": 3,
                    "difficulty": "easy",
                    "tags": ["overview", document["document_type"]]
                }
            ])
        
        elif pair_type == "clause_explanation":
            # Extract sample clauses (simplified)
            clauses = self._extract_sample_clauses(document["content"])
            for clause in clauses[:3]:  # Limit to 3 clauses
                pairs.append({
                    "prompt": f"Explain this legal clause in simple terms:\n\n\"{clause}\"",
                    "response": f"This clause means that...",
                    "quality_score": 4,
                    "difficulty": "medium",
                    "tags": ["clause_explanation", document["document_type"]]
                })
        
        elif pair_type == "qa":
            # Generate Q&A pairs
            qa_pairs = [
                {
                    "prompt": f"What is the main purpose of this {document['document_type']}?",
                    "response": f"The main purpose of this {document['document_type']} is to...",
                    "quality_score": 4,
                    "difficulty": "easy"
                },
                {
                    "prompt": f"What are the key obligations in this {document['document_type']}?",
                    "response": "The key obligations include...",
                    "quality_score": 4,
                    "difficulty": "medium"
                },
                {
                    "prompt": f"What happens if someone violates this {document['document_type']}?",
                    "response": "If this agreement is violated...",
                    "quality_score": 3,
                    "difficulty": "hard"
                }
            ]
            pairs.extend(qa_pairs)
        
        return pairs

    def _extract_sample_clauses(self, content: str) -> List[str]:
        """Extract sample clauses from document content"""
        # Simple clause extraction - split by paragraphs and take meaningful ones
        paragraphs = content.split('\n\n')
        clauses = []
        
        for para in paragraphs:
            if len(para.split()) > 10 and len(para.split()) < 100:  # Reasonable clause length
                clauses.append(para.strip())
        
        return clauses[:5]  # Return up to 5 clauses

    async def start_anonymization(self, document_ids: List[str], supabase: SupabaseClient) -> str:
        """Start anonymization process for documents"""
        job = DataProcessingJob(
            job_type="anonymization",
            status="running",
            input_documents=document_ids,
            total_items=len(document_ids),
            start_time=datetime.utcnow()
        )
        
        created_job = await supabase.insert("data_processing_jobs", job.dict())
        
        # Start anonymization asynchronously
        asyncio.create_task(self._anonymize_documents(created_job["id"], document_ids, supabase))
        
        return created_job["id"]

    async def _anonymize_documents(self, job_id: str, document_ids: List[str], supabase: SupabaseClient):
        """Anonymize multiple documents"""
        try:
            processed = 0
            
            for doc_id in document_ids:
                # Get and anonymize document
                documents = await supabase.select("legal_documents", filters={"id": doc_id})
                
                if documents and not documents[0]["is_anonymized"]:
                    document = documents[0]
                    anonymized_content = self._anonymize_content(document["content"])
                    
                    await supabase.update(
                        "legal_documents",
                        {"content": anonymized_content, "is_anonymized": True},
                        {"id": doc_id}
                    )
                
                processed += 1
                progress = (processed / len(document_ids)) * 100
                
                await supabase.update(
                    "data_processing_jobs",
                    {"progress": progress, "processed_items": processed},
                    {"id": job_id}
                )
            
            # Complete job
            await supabase.update(
                "data_processing_jobs",
                {
                    "status": "completed",
                    "progress": 100.0,
                    "end_time": datetime.utcnow().isoformat(),
                    "results": {"anonymized_documents": processed}
                },
                {"id": job_id}
            )
            
        except Exception as e:
            await supabase.update(
                "data_processing_jobs",
                {
                    "status": "failed",
                    "end_time": datetime.utcnow().isoformat(),
                    "error_log": str(e)
                },
                {"id": job_id}
            )

    async def calculate_dataset_metrics(self, supabase: SupabaseClient) -> DatasetMetrics:
        """Calculate and store current dataset metrics"""
        
        # Get all data for calculations
        all_documents = await supabase.select("legal_documents")
        all_pairs = await supabase.select("prompt_response_pairs")
        
        total_documents = len(all_documents)
        total_pairs = len(all_pairs)
        verified_pairs = len([p for p in all_pairs if p["is_verified"]])
        
        # Type distribution
        type_distribution = {}
        for pair in all_pairs:
            pair_type = pair["pair_type"]
            type_distribution[pair_type] = type_distribution.get(pair_type, 0) + 1
        
        # Quality distribution
        quality_distribution = {}
        for pair in all_pairs:
            score = str(pair["quality_score"])
            quality_distribution[score] = quality_distribution.get(score, 0) + 1
        
        # Language distribution
        language_distribution = {}
        for doc in all_documents:
            lang = doc["language"]
            language_distribution[lang] = language_distribution.get(lang, 0) + 1
        
        # Domain distribution
        domain_distribution = {}
        for doc in all_documents:
            if doc["domains"]:
                for domain in doc["domains"]:
                    domain_distribution[domain] = domain_distribution.get(domain, 0) + 1
        
        # Average lengths
        avg_prompt_length = sum([len(p["prompt"]) for p in all_pairs]) / total_pairs if total_pairs else 0
        avg_response_length = sum([len(p["response"]) for p in all_pairs]) / total_pairs if total_pairs else 0
        
        # Average quality
        avg_quality = sum([p["quality_score"] for p in all_pairs]) / total_pairs if total_pairs else 0
        
        # Create metrics record
        metrics = DatasetMetrics(
            total_documents=total_documents,
            total_pairs=total_pairs,
            verified_pairs=verified_pairs,
            type_distribution=type_distribution,
            quality_distribution=quality_distribution,
            language_distribution=language_distribution,
            domain_distribution=domain_distribution,
            average_prompt_length=avg_prompt_length,
            average_response_length=avg_response_length,
            average_quality_score=avg_quality,
            verification_rate=(verified_pairs / total_pairs * 100) if total_pairs > 0 else 0,
            last_updated=datetime.utcnow()
        )
        
        await supabase.insert("dataset_metrics", metrics.dict())
        return metrics

    async def export_dataset(
        self, 
        supabase: SupabaseClient, 
        format: str = "jsonl",
        pair_types: Optional[List[str]] = None,
        min_quality: int = 3,
        verified_only: bool = False
    ) -> str:
        """Export training dataset in specified format"""
        
        # Get all pairs
        all_pairs = await supabase.select("prompt_response_pairs")
        
        # Apply filters
        filtered_pairs = all_pairs
        
        if pair_types:
            filtered_pairs = [p for p in filtered_pairs if p["pair_type"] in pair_types]
        
        if min_quality:
            filtered_pairs = [p for p in filtered_pairs if p["quality_score"] >= min_quality]
        
        if verified_only:
            filtered_pairs = [p for p in filtered_pairs if p["is_verified"]]
        
        if format == "jsonl":
            lines = []
            for pair in filtered_pairs:
                line = {
                    "prompt": pair["prompt"],
                    "response": pair["response"],
                    "type": pair["pair_type"],
                    "quality": pair["quality_score"],
                    "domain": pair["domain"],
                    "difficulty": pair["difficulty"]
                }
                lines.append(json.dumps(line))
            return '\n'.join(lines)
        
        elif format == "csv":
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Header
            writer.writerow(["prompt", "response", "type", "quality", "domain", "difficulty"])
            
            # Data
            for pair in filtered_pairs:
                writer.writerow([
                    pair["prompt"],
                    pair["response"],
                    pair["pair_type"],
                    pair["quality_score"],
                    pair["domain"],
                    pair["difficulty"]
                ])
            
            return output.getvalue()
        
        else:
            raise ValueError(f"Unsupported format: {format}")