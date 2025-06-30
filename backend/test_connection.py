#!/usr/bin/env python3
"""
Test script to verify Supabase database connection and configuration
"""
import os
import sys
import json
from datetime import datetime

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_environment_setup():
    """Test if environment is properly configured"""
    print("\n🔧 Environment Setup Check:")
    print("-" * 30)
    
    # Check if .env file exists
    env_file = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_file):
        print("✅ .env file found")
    else:
        print("❌ .env file missing")
        print("   Create .env file from .env.example")
        return False
    
    # Load environment variables from .env file
    try:
        with open(env_file, 'r') as f:
            env_content = f.read()
        
        # Parse .env file manually
        env_vars = {}
        for line in env_content.split('\n'):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
        
        # Check required environment variables
        required_vars = [
            'SUPABASE_URL',
            'SUPABASE_KEY', 
            'SUPABASE_SERVICE_ROLE_KEY'
        ]
        
        missing_vars = []
        for var in required_vars:
            if var in env_vars and env_vars[var]:
                print(f"✅ {var} is set")
            else:
                print(f"❌ {var} is missing")
                missing_vars.append(var)
        
        if missing_vars:
            print(f"\n⚠️  Missing variables: {', '.join(missing_vars)}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error reading .env file: {e}")
        return False

def test_supabase_connection():
    """Test Supabase connection using simple HTTP requests"""
    print("🔍 Testing Supabase Database Connection...")
    print("=" * 50)
    
    # Load environment variables
    env_file = os.path.join(os.path.dirname(__file__), '.env')
    env_vars = {}
    
    try:
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    except Exception as e:
        print(f"❌ Error loading environment: {e}")
        return False
    
    supabase_url = env_vars.get('SUPABASE_URL', '')
    supabase_key = env_vars.get('SUPABASE_KEY', '')
    service_role_key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY', '')
    
    print("📋 Configuration Check:")
    print(f"   SUPABASE_URL: {'✅ Set' if supabase_url else '❌ Missing'}")
    print(f"   SUPABASE_KEY: {'✅ Set' if supabase_key else '❌ Missing'}")
    print(f"   SUPABASE_SERVICE_ROLE_KEY: {'✅ Set' if service_role_key else '❌ Missing'}")
    
    if not all([supabase_url, supabase_key, service_role_key]):
        print("\n❌ Missing required Supabase configuration!")
        print("Please check your .env file and ensure all Supabase variables are set.")
        return False
    
    print(f"\n🌐 Supabase URL: {supabase_url}")
    print(f"🔑 API Key: {supabase_key[:20]}...")
    
    # Test connection using curl (available in WebContainer)
    print("\n🔌 Testing Supabase connection...")
    
    # Test each required table
    tables_to_test = [
        'fine_tuning_jobs',
        'training_metrics', 
        'validation_results',
        'model_deployments',
        'legal_documents',
        'prompt_response_pairs',
        'dataset_metrics',
        'data_processing_jobs'
    ]
    
    table_results = {}
    
    for table in tables_to_test:
        print(f"   Testing {table}...")
        
        # Use curl to test table access
        curl_cmd = f'''curl -s -H "apikey: {service_role_key}" -H "Authorization: Bearer {service_role_key}" "{supabase_url}/rest/v1/{table}?select=id&limit=1"'''
        
        try:
            import subprocess
            result = subprocess.run(curl_cmd, shell=True, capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                try:
                    response_data = json.loads(result.stdout)
                    if isinstance(response_data, list):
                        table_results[table] = {'status': '✅', 'count': len(response_data)}
                        print(f"      ✅ Accessible")
                    else:
                        table_results[table] = {'status': '⚠️', 'error': 'Unexpected response format'}
                        print(f"      ⚠️  Unexpected response")
                except json.JSONDecodeError:
                    if "error" in result.stdout.lower():
                        table_results[table] = {'status': '❌', 'error': result.stdout}
                        print(f"      ❌ Error: {result.stdout[:100]}")
                    else:
                        table_results[table] = {'status': '⚠️', 'error': 'Invalid JSON response'}
                        print(f"      ⚠️  Invalid response format")
            else:
                table_results[table] = {'status': '❌', 'error': result.stderr}
                print(f"      ❌ Connection failed: {result.stderr[:100]}")
                
        except subprocess.TimeoutExpired:
            table_results[table] = {'status': '❌', 'error': 'Request timeout'}
            print(f"      ❌ Timeout")
        except Exception as e:
            table_results[table] = {'status': '❌', 'error': str(e)}
            print(f"      ❌ Error: {e}")
    
    # Test write operations
    print("\n✏️  Testing write operations...")
    test_data = {
        'name': 'Connection Test Job',
        'status': 'preparing',
        'model_name': 'test-model',
        'base_model': 'gemini-1.5-flash',
        'config': '{"test": true}',
        'progress': 0.0
    }
    
    # Insert test record
    insert_cmd = f'''curl -s -X POST -H "apikey: {service_role_key}" -H "Authorization: Bearer {service_role_key}" -H "Content-Type: application/json" -d '{json.dumps(test_data)}' "{supabase_url}/rest/v1/fine_tuning_jobs"'''
    
    try:
        result = subprocess.run(insert_cmd, shell=True, capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0 and result.stdout:
            try:
                insert_response = json.loads(result.stdout)
                if isinstance(insert_response, list) and len(insert_response) > 0:
                    test_job_id = insert_response[0]['id']
                    print(f"   ✅ Insert successful (ID: {test_job_id})")
                    
                    # Clean up - delete test record
                    delete_cmd = f'''curl -s -X DELETE -H "apikey: {service_role_key}" -H "Authorization: Bearer {service_role_key}" "{supabase_url}/rest/v1/fine_tuning_jobs?id=eq.{test_job_id}"'''
                    
                    delete_result = subprocess.run(delete_cmd, shell=True, capture_output=True, text=True, timeout=10)
                    if delete_result.returncode == 0:
                        print("   ✅ Delete successful (cleanup completed)")
                    else:
                        print("   ⚠️  Delete failed (manual cleanup may be needed)")
                        
                else:
                    print(f"   ❌ Insert failed: Unexpected response format")
            except json.JSONDecodeError:
                print(f"   ❌ Insert failed: Invalid JSON response")
        else:
            print(f"   ❌ Insert failed: {result.stderr}")
            
    except Exception as e:
        print(f"   ❌ Write test failed: {e}")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 CONNECTION TEST SUMMARY")
    print("=" * 50)
    
    successful_tables = len([t for t in table_results.values() if t['status'] == '✅'])
    total_tables = len(table_results)
    
    print(f"✅ Connection Status: {'SUCCESSFUL' if successful_tables > 0 else 'FAILED'}")
    print(f"📊 Tables Accessible: {successful_tables}/{total_tables}")
    
    if successful_tables == total_tables:
        print("\n🎉 All systems operational! Your Supabase backend is ready.")
        print("\nNext steps:")
        print("1. Start the backend: cd backend && python -m uvicorn app.main:app --reload")
        print("2. Access API docs: http://localhost:8000/docs")
        print("3. Test admin login with your credentials")
        return True
    elif successful_tables > 0:
        print(f"\n⚠️  {total_tables - successful_tables} tables have issues.")
        print("\nPartial success - some tables are accessible.")
        print("Check the table creation SQL script in the README.md")
        return True
    else:
        print("\n❌ No tables accessible. Check:")
        print("1. Supabase project is active and accessible")
        print("2. API keys are correct and have proper permissions")
        print("3. Database schema has been created")
        print("4. Row Level Security policies allow service role access")
        return False

def main():
    """Main test function"""
    print("🚀 Supabase Backend Connection Test")
    print("=" * 50)
    
    # Test environment setup
    env_ok = test_environment_setup()
    
    if not env_ok:
        print("\n❌ Environment setup issues detected. Please fix before testing connection.")
        return
    
    # Test Supabase connection
    connection_ok = test_supabase_connection()
    
    if connection_ok:
        print("\n🎉 SUCCESS: Supabase backend is operational!")
    else:
        print("\n❌ FAILED: Connection issues detected.")
        print("\nTroubleshooting steps:")
        print("1. Verify your Supabase project is active")
        print("2. Check that API keys are correct and not expired")
        print("3. Ensure database schema is created (run SQL from README)")
        print("4. Check Row Level Security policies")

if __name__ == "__main__":
    main()