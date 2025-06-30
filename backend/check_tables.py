#!/usr/bin/env python3
"""
Check if all required Supabase tables exist and have correct structure
"""
import asyncio
import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import SupabaseClient

async def check_table_structure():
    """Check if all required tables exist in Supabase"""
    print("🔍 Checking Supabase Table Structure...")
    print("=" * 50)
    
    supabase = SupabaseClient()
    
    # Required tables and their key columns
    required_tables = {
        'fine_tuning_jobs': [
            'id', 'name', 'status', 'model_name', 'base_model', 
            'config', 'progress', 'start_time', 'end_time', 'model_id', 
            'logs', 'created_at', 'updated_at'
        ],
        'training_metrics': [
            'id', 'job_id', 'accuracy', 'relevance', 'readability', 
            'coherence', 'legal_accuracy', 'simplification_score',
            'clause_explanation_score', 'qa_score', 'overall_score',
            'training_loss', 'validation_loss', 'learning_rate', 'created_at'
        ],
        'validation_results': [
            'id', 'job_id', 'query', 'expected_response', 'actual_response',
            'accuracy_score', 'relevance_score', 'readability_score',
            'test_category', 'difficulty', 'created_at'
        ],
        'model_deployments': [
            'id', 'job_id', 'model_endpoint', 'deployment_status',
            'total_requests', 'average_latency', 'error_rate',
            'uptime_percentage', 'cpu_usage', 'memory_usage',
            'deployed_at', 'last_health_check', 'created_at', 'updated_at'
        ],
        'legal_documents': [
            'id', 'title', 'content', 'document_type', 'jurisdiction',
            'source', 'word_count', 'complexity', 'domains', 'language',
            'is_processed', 'is_anonymized', 'processing_notes',
            'document_date', 'created_at', 'updated_at'
        ],
        'prompt_response_pairs': [
            'id', 'prompt', 'response', 'pair_type', 'source_document_id',
            'source_document_title', 'quality_score', 'is_verified',
            'reviewed_by', 'tags', 'difficulty', 'domain',
            'used_in_training', 'training_job_ids', 'created_at', 'updated_at'
        ],
        'dataset_metrics': [
            'id', 'total_documents', 'total_pairs', 'verified_pairs',
            'type_distribution', 'quality_distribution', 'language_distribution',
            'domain_distribution', 'average_prompt_length', 'average_response_length',
            'average_quality_score', 'verification_rate', 'last_updated',
            'data_version', 'created_at'
        ],
        'data_processing_jobs': [
            'id', 'job_type', 'status', 'input_documents', 'output_pairs',
            'config', 'progress', 'total_items', 'processed_items',
            'failed_items', 'results', 'error_log', 'start_time',
            'end_time', 'created_at', 'updated_at'
        ]
    }
    
    table_status = {}
    
    for table_name, expected_columns in required_tables.items():
        print(f"\n📊 Checking table: {table_name}")
        
        try:
            # Try to query the table structure
            result = await supabase.select(table_name, limit=1)
            
            if result is not None:
                print(f"   ✅ Table exists")
                
                # Check if we can get column info (simplified check)
                if len(result) > 0:
                    actual_columns = list(result[0].keys())
                    missing_columns = [col for col in expected_columns if col not in actual_columns]
                    extra_columns = [col for col in actual_columns if col not in expected_columns]
                    
                    if not missing_columns and not extra_columns:
                        print(f"   ✅ All columns present")
                        table_status[table_name] = 'perfect'
                    elif missing_columns:
                        print(f"   ⚠️  Missing columns: {missing_columns}")
                        table_status[table_name] = 'missing_columns'
                    else:
                        print(f"   ✅ Structure looks good")
                        table_status[table_name] = 'good'
                else:
                    print(f"   ✅ Table exists (empty)")
                    table_status[table_name] = 'empty'
            else:
                print(f"   ❌ Table query returned None")
                table_status[table_name] = 'error'
                
        except Exception as e:
            print(f"   ❌ Error accessing table: {e}")
            table_status[table_name] = 'missing'
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TABLE STRUCTURE SUMMARY")
    print("=" * 50)
    
    perfect_tables = len([s for s in table_status.values() if s == 'perfect'])
    good_tables = len([s for s in table_status.values() if s in ['perfect', 'good', 'empty']])
    total_tables = len(required_tables)
    
    print(f"✅ Perfect tables: {perfect_tables}/{total_tables}")
    print(f"✅ Working tables: {good_tables}/{total_tables}")
    
    if good_tables == total_tables:
        print("\n🎉 All tables are properly configured!")
        return True
    else:
        print(f"\n⚠️  {total_tables - good_tables} tables need attention.")
        
        missing_tables = [name for name, status in table_status.items() if status == 'missing']
        if missing_tables:
            print(f"\n❌ Missing tables: {missing_tables}")
            print("\nTo create missing tables, run the SQL script in the README.md")
        
        return False

if __name__ == "__main__":
    asyncio.run(check_table_structure())