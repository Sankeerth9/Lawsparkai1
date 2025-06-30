import { supabase } from '../lib/supabase'

const EDGE_FUNCTION_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

interface EdgeFunctionResponse<T = any> {
  data?: T
  error?: string
}

class EdgeFunctionService {
  private async callFunction<T = any>(
    functionName: string,
    path: string = '',
    options: {
      method?: string
      body?: any
      headers?: Record<string, string>
    } = {}
  ): Promise<EdgeFunctionResponse<T>> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      const url = `${EDGE_FUNCTION_BASE_URL}/${functionName}${path}`
      
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Edge function call failed')
      }

      return { data: result }
    } catch (error) {
      console.error(`Edge function ${functionName} error:`, error)
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Fine-tuning job management
  async listFineTuningJobs() {
    return this.callFunction('fine-tuning-manager', '/jobs')
  }

  async createFineTuningJob(jobData: {
    name: string
    description?: string
    model_name: string
    base_model: string
    training_dataset_id: string
    validation_dataset_id?: string
    hyperparameters?: Record<string, any>
    focus_areas?: string[]
    priority?: number
  }) {
    return this.callFunction('fine-tuning-manager', '/jobs', {
      method: 'POST',
      body: jobData
    })
  }

  async getFineTuningJob(jobId: string) {
    return this.callFunction('fine-tuning-manager', `/jobs/${jobId}`)
  }

  async cancelFineTuningJob(jobId: string) {
    return this.callFunction('fine-tuning-manager', `/jobs/${jobId}/cancel`, {
      method: 'POST'
    })
  }

  async getJobStatistics(jobId: string) {
    return this.callFunction('fine-tuning-manager', `/jobs/${jobId}/statistics`)
  }

  async updateFineTuningJob(jobId: string, updateData: {
    status?: string
    progress?: number
    current_epoch?: number
    current_step?: number
    logs?: string[]
    error_message?: string
  }) {
    return this.callFunction('fine-tuning-manager', `/jobs/${jobId}`, {
      method: 'PUT',
      body: updateData
    })
  }

  // Authentication and user management
  async createAdminUser(userData: {
    email: string
    password: string
    full_name: string
    organization?: string
    job_title?: string
    admin_level?: number
    department?: string
  }) {
    return this.callFunction('auth-admin', '/signup', {
      method: 'POST',
      body: userData
    })
  }

  async getUserProfile() {
    return this.callFunction('auth-admin', '/profile')
  }

  async updateUserProfile(profileData: {
    full_name?: string
    avatar_url?: string
    organization?: string
    job_title?: string
    phone?: string
    timezone?: string
    language?: string
    preferences?: any
    notification_settings?: any
  }) {
    return this.callFunction('auth-admin', '/profile', {
      method: 'PUT',
      body: profileData
    })
  }

  async listUsers() {
    return this.callFunction('auth-admin', '/users')
  }

  async updateUserRole(roleData: {
    user_id: string
    role: string
    admin_level?: number
    permissions?: string[]
  }) {
    return this.callFunction('auth-admin', '/users/role', {
      method: 'PUT',
      body: roleData
    })
  }

  async getUserPermissions() {
    return this.callFunction('auth-admin', '/permissions')
  }

  async getAuditLogs() {
    return this.callFunction('auth-admin', '/audit-logs')
  }

  // Dataset management
  async listDatasets() {
    return this.callFunction('dataset-manager', '/datasets')
  }

  async uploadDataset(datasetData: {
    name: string
    description?: string
    dataset_type: 'training' | 'validation' | 'test' | 'mixed'
    format: 'jsonl' | 'csv' | 'parquet' | 'json'
    file_data: string // Base64 encoded
    file_name: string
    is_public?: boolean
  }) {
    return this.callFunction('dataset-manager', '/datasets', {
      method: 'POST',
      body: datasetData
    })
  }

  async getDataset(datasetId: string) {
    return this.callFunction('dataset-manager', `/datasets/${datasetId}`)
  }

  async deleteDataset(datasetId: string) {
    return this.callFunction('dataset-manager', `/datasets/${datasetId}`, {
      method: 'DELETE'
    })
  }

  async validateDataset(datasetId: string) {
    return this.callFunction('dataset-manager', `/datasets/${datasetId}/validate`, {
      method: 'POST'
    })
  }

  // Utility methods
  async checkFunctionHealth(functionName: string) {
    try {
      const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/${functionName}/health`)
      return response.ok
    } catch (error) {
      return false
    }
  }

  // Batch operations
  async batchCreateJobs(jobs: Array<{
    name: string
    model_name: string
    training_dataset_id: string
    hyperparameters?: Record<string, any>
  }>) {
    const results = []
    
    for (const job of jobs) {
      const result = await this.createFineTuningJob(job)
      results.push(result)
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    return results
  }

  async batchCancelJobs(jobIds: string[]) {
    const results = []
    
    for (const jobId of jobIds) {
      const result = await this.cancelFineTuningJob(jobId)
      results.push({ jobId, result })
    }
    
    return results
  }
}

export const edgeFunctionService = new EdgeFunctionService()

// React hooks for easier integration
export const useFineTuningJobs = () => {
  const [jobs, setJobs] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadJobs = async () => {
    setLoading(true)
    const result = await edgeFunctionService.listFineTuningJobs()
    
    if (result.error) {
      setError(result.error)
    } else {
      setJobs(result.data?.jobs || [])
      setError(null)
    }
    
    setLoading(false)
  }

  React.useEffect(() => {
    loadJobs()
  }, [])

  return { jobs, loading, error, refetch: loadJobs }
}

export const useDatasets = () => {
  const [datasets, setDatasets] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadDatasets = async () => {
    setLoading(true)
    const result = await edgeFunctionService.listDatasets()
    
    if (result.error) {
      setError(result.error)
    } else {
      setDatasets(result.data?.datasets || [])
      setError(null)
    }
    
    setLoading(false)
  }

  React.useEffect(() => {
    loadDatasets()
  }, [])

  return { datasets, loading, error, refetch: loadDatasets }
}

// Add React import for hooks
import React from 'react'