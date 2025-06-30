import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface FineTuningRequest {
  job_id: string
  training_data: Array<{
    messages: Array<{
      role: 'system' | 'user' | 'assistant'
      content: string
    }>
  }>
  model_config: {
    base_model: string
    hyperparameters?: {
      n_epochs?: number
      batch_size?: number
      learning_rate_multiplier?: number
    }
  }
  validation_data?: Array<{
    messages: Array<{
      role: 'system' | 'user' | 'assistant'
      content: string
    }>
  }>
}

interface OpenAIFineTuningJob {
  id: string
  object: string
  model: string
  created_at: number
  finished_at: number | null
  fine_tuned_model: string | null
  organization_id: string
  result_files: string[]
  status: 'validating_files' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'
  validation_file: string | null
  training_file: string
  hyperparameters: {
    n_epochs: number
    batch_size?: number
    learning_rate_multiplier?: number
  }
  trained_tokens: number | null
  error: null | {
    code: string
    param: string
    message: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // Route handling
    if (path === '/openai-fine-tuning/start' && method === 'POST') {
      const requestData = await req.json()
      return await startFineTuning(supabaseClient, user.id, requestData)
    }
    
    if (path === '/openai-fine-tuning/status' && method === 'GET') {
      const jobId = url.searchParams.get('job_id')
      return await getFineTuningStatus(supabaseClient, user.id, jobId!)
    }
    
    if (path === '/openai-fine-tuning/cancel' && method === 'POST') {
      const { job_id } = await req.json()
      return await cancelFineTuning(supabaseClient, user.id, job_id)
    }
    
    if (path === '/openai-fine-tuning/models' && method === 'GET') {
      return await listFineTunedModels(supabaseClient, user.id)
    }

    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('OpenAI Fine-tuning Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function startFineTuning(supabaseClient: any, userId: string, requestData: FineTuningRequest) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  // Validate job exists and user has access
  const { data: job, error: jobError } = await supabaseClient
    .from('fine_tuning_jobs')
    .select('*')
    .eq('id', requestData.job_id)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found or access denied')
  }

  // Check user permissions
  const { data: userData } = await supabaseClient
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (job.created_by !== userId && !['admin', 'super_admin'].includes(userData?.role)) {
    throw new Error('Insufficient permissions')
  }

  try {
    // Update job status to preparing
    await supabaseClient
      .from('fine_tuning_jobs')
      .update({
        status: 'preparing',
        started_at: new Date().toISOString(),
        logs: [...(job.logs || []), 'Starting OpenAI fine-tuning process']
      })
      .eq('id', requestData.job_id)

    // Upload training data to OpenAI
    const trainingFileResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'multipart/form-data'
      },
      body: createFormData('training.jsonl', JSON.stringify(requestData.training_data), 'fine-tune')
    })

    if (!trainingFileResponse.ok) {
      const errorData = await trainingFileResponse.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Failed to upload training data'}`)
    }

    const trainingFile = await trainingFileResponse.json()

    // Upload validation data if provided
    let validationFile = null
    if (requestData.validation_data && requestData.validation_data.length > 0) {
      const validationFileResponse = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'multipart/form-data'
        },
        body: createFormData('validation.jsonl', JSON.stringify(requestData.validation_data), 'fine-tune')
      })

      if (validationFileResponse.ok) {
        validationFile = await validationFileResponse.json()
      }
    }

    // Create fine-tuning job
    const fineTuningResponse = await fetch('https://api.openai.com/v1/fine_tuning/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        training_file: trainingFile.id,
        validation_file: validationFile?.id,
        model: requestData.model_config.base_model,
        hyperparameters: requestData.model_config.hyperparameters || {
          n_epochs: 3
        }
      })
    })

    if (!fineTuningResponse.ok) {
      const errorData = await fineTuningResponse.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Failed to create fine-tuning job'}`)
    }

    const openaiJob: OpenAIFineTuningJob = await fineTuningResponse.json()

    // Update job with OpenAI job details
    await supabaseClient
      .from('fine_tuning_jobs')
      .update({
        status: 'training',
        current_phase: 'training',
        model_id: openaiJob.id,
        logs: [...(job.logs || []), `OpenAI fine-tuning job created: ${openaiJob.id}`],
        config: {
          ...job.config,
          openai_job_id: openaiJob.id,
          training_file_id: trainingFile.id,
          validation_file_id: validationFile?.id
        }
      })
      .eq('id', requestData.job_id)

    // Start monitoring the job
    monitorOpenAIJob(supabaseClient, requestData.job_id, openaiJob.id)

    // Log the API usage
    await supabaseClient
      .from('api_usage')
      .insert({
        user_id: userId,
        endpoint: '/openai-fine-tuning/start',
        method: 'POST',
        tokens_used: estimateTokenCount(requestData.training_data),
        status_code: 200,
        metadata: {
          job_id: requestData.job_id,
          training_examples: requestData.training_data.length,
          model: requestData.model_config.base_model
        }
      })

    return new Response(
      JSON.stringify({
        message: 'Fine-tuning started successfully',
        openai_job_id: openaiJob.id,
        status: openaiJob.status
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    // Update job status to failed
    await supabaseClient
      .from('fine_tuning_jobs')
      .update({
        status: 'failed',
        error_logs: [...(job.error_logs || []), error.message],
        completed_at: new Date().toISOString()
      })
      .eq('id', requestData.job_id)

    throw error
  }
}

async function getFineTuningStatus(supabaseClient: any, userId: string, jobId: string) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  // Get job from database
  const { data: job, error: jobError } = await supabaseClient
    .from('fine_tuning_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  // Check user permissions
  const { data: userData } = await supabaseClient
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (job.created_by !== userId && !['admin', 'super_admin'].includes(userData?.role)) {
    throw new Error('Insufficient permissions')
  }

  if (!job.model_id || !job.config?.openai_job_id) {
    return new Response(
      JSON.stringify({
        job_id: jobId,
        status: job.status,
        progress: job.progress,
        message: 'Job not yet started with OpenAI'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Get status from OpenAI API
    const openaiResponse = await fetch(`https://api.openai.com/v1/fine_tuning/jobs/${job.config.openai_job_id}`, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      }
    })

    if (!openaiResponse.ok) {
      throw new Error('Failed to get status from OpenAI API')
    }

    const openaiJob: OpenAIFineTuningJob = await openaiResponse.json()

    // Map OpenAI status to our status
    let localStatus = job.status
    let progress = job.progress

    switch (openaiJob.status) {
      case 'validating_files':
      case 'queued':
        localStatus = 'preparing'
        progress = 10
        break
      case 'running':
        localStatus = 'training'
        progress = 50
        break
      case 'succeeded':
        localStatus = 'completed'
        progress = 100
        break
      case 'failed':
        localStatus = 'failed'
        break
      case 'cancelled':
        localStatus = 'cancelled'
        break
    }

    // Update job in database
    await supabaseClient
      .from('fine_tuning_jobs')
      .update({
        status: localStatus,
        progress: progress,
        ...(openaiJob.status === 'succeeded' && {
          completed_at: new Date().toISOString(),
          deployment_ready: true,
          model_artifacts: {
            model_name: openaiJob.fine_tuned_model,
            trained_tokens: openaiJob.trained_tokens
          }
        }),
        ...(openaiJob.status === 'failed' && {
          completed_at: new Date().toISOString(),
          error_logs: [...(job.error_logs || []), openaiJob.error?.message || 'Unknown error']
        })
      })
      .eq('id', jobId)

    return new Response(
      JSON.stringify({
        job_id: jobId,
        status: localStatus,
        progress: progress,
        openai_status: openaiJob.status,
        openai_job_id: job.config.openai_job_id,
        created_at: new Date(openaiJob.created_at * 1000).toISOString(),
        finished_at: openaiJob.finished_at ? new Date(openaiJob.finished_at * 1000).toISOString() : null,
        fine_tuned_model: openaiJob.fine_tuned_model,
        trained_tokens: openaiJob.trained_tokens,
        error: openaiJob.error
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error getting OpenAI status:', error)
    
    return new Response(
      JSON.stringify({
        job_id: jobId,
        status: job.status,
        progress: job.progress,
        error: 'Failed to get status from OpenAI API'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function cancelFineTuning(supabaseClient: any, userId: string, jobId: string) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  // Get job from database
  const { data: job, error: jobError } = await supabaseClient
    .from('fine_tuning_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  // Check user permissions
  const { data: userData } = await supabaseClient
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (job.created_by !== userId && !['admin', 'super_admin'].includes(userData?.role)) {
    throw new Error('Insufficient permissions')
  }

  if (!job.model_id || !job.config?.openai_job_id) {
    // Job hasn't started with OpenAI yet, just cancel locally
    await supabaseClient
      .from('fine_tuning_jobs')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        logs: [...(job.logs || []), 'Job cancelled before OpenAI processing']
      })
      .eq('id', jobId)

    return new Response(
      JSON.stringify({ message: 'Job cancelled successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Cancel with OpenAI API
    const openaiResponse = await fetch(`https://api.openai.com/v1/fine_tuning/jobs/${job.config.openai_job_id}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      }
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    // Update job in database
    await supabaseClient
      .from('fine_tuning_jobs')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        logs: [...(job.logs || []), 'Job cancelled via OpenAI API']
      })
      .eq('id', jobId)

    return new Response(
      JSON.stringify({ message: 'Job cancelled successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error cancelling OpenAI job:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function listFineTunedModels(supabaseClient: any, userId: string) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  try {
    // Get models from OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      }
    })

    if (!openaiResponse.ok) {
      throw new Error('Failed to get models from OpenAI API')
    }

    const openaiData = await openaiResponse.json()
    
    // Filter for fine-tuned models (they start with "ft:")
    const fineTunedModels = openaiData.data.filter((model: any) => 
      model.id.startsWith('ft:')
    )

    // Get user's jobs from database
    const { data: userJobs, error: jobsError } = await supabaseClient
      .from('fine_tuning_jobs')
      .select('id, model_artifacts, model_name')
      .eq('created_by', userId)
      .eq('status', 'completed')

    if (jobsError) {
      throw new Error('Failed to get user jobs')
    }

    // Match OpenAI models with user's jobs
    const matchedModels = fineTunedModels.map((model: any) => {
      const matchingJob = userJobs.find((job: any) => 
        job.model_artifacts?.model_name === model.id
      )
      
      return {
        id: model.id,
        created: new Date(model.created * 1000).toISOString(),
        owned_by: model.owned_by,
        job_id: matchingJob?.id,
        job_model_name: matchingJob?.model_name
      }
    })

    return new Response(
      JSON.stringify({ models: matchedModels }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error listing OpenAI models:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

function createFormData(filename: string, content: string, purpose: string): FormData {
  const formData = new FormData()
  const blob = new Blob([content], { type: 'application/json' })
  formData.append('file', blob, filename)
  formData.append('purpose', purpose)
  return formData
}

function estimateTokenCount(data: any[]): number {
  // Rough estimate: 1 token ≈ 4 characters
  const jsonString = JSON.stringify(data)
  return Math.ceil(jsonString.length / 4)
}

async function monitorOpenAIJob(supabaseClient: any, jobId: string, openaiJobId: string) {
  // This would be implemented as a background process in a production environment
  // For this example, we'll simulate periodic polling
  
  const checkStatus = async () => {
    try {
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
      if (!openaiApiKey) return

      // Get job from OpenAI API
      const openaiResponse = await fetch(`https://api.openai.com/v1/fine_tuning/jobs/${openaiJobId}`, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`
        }
      })

      if (!openaiResponse.ok) return
      
      const openaiJob: OpenAIFineTuningJob = await openaiResponse.json()
      
      // Update job status in database
      let localStatus = 'training'
      let progress = 50
      let completed = false

      switch (openaiJob.status) {
        case 'validating_files':
        case 'queued':
          localStatus = 'preparing'
          progress = 10
          break
        case 'running':
          localStatus = 'training'
          progress = 50
          break
        case 'succeeded':
          localStatus = 'completed'
          progress = 100
          completed = true
          break
        case 'failed':
          localStatus = 'failed'
          completed = true
          break
        case 'cancelled':
          localStatus = 'cancelled'
          completed = true
          break
      }

      await supabaseClient
        .from('fine_tuning_jobs')
        .update({
          status: localStatus,
          progress: progress,
          ...(completed && { completed_at: new Date().toISOString() }),
          ...(openaiJob.status === 'succeeded' && {
            deployment_ready: true,
            model_artifacts: {
              model_name: openaiJob.fine_tuned_model,
              trained_tokens: openaiJob.trained_tokens
            }
          }),
          ...(openaiJob.status === 'failed' && {
            error_logs: [openaiJob.error?.message || 'Unknown error']
          }),
          logs: [
            ...(await getCurrentLogs(supabaseClient, jobId)),
            `OpenAI job status: ${openaiJob.status} at ${new Date().toISOString()}`
          ]
        })
        .eq('id', jobId)

      // If job is still running, check again later
      if (!completed) {
        setTimeout(checkStatus, 60000) // Check every minute
      }
    } catch (error) {
      console.error('Error monitoring OpenAI job:', error)
    }
  }

  // Start monitoring
  checkStatus()
}

async function getCurrentLogs(supabaseClient: any, jobId: string): Promise<string[]> {
  const { data } = await supabaseClient
    .from('fine_tuning_jobs')
    .select('logs')
    .eq('id', jobId)
    .single()
  
  return data?.logs || []
}