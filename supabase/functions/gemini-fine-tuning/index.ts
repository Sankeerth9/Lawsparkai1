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
    input: string
    output: string
    metadata?: Record<string, any>
  }>
  model_config: {
    base_model: string
    learning_rate: number
    epochs: number
    batch_size: number
    temperature: number
    max_tokens: number
  }
  validation_data?: Array<{
    input: string
    output: string
  }>
}

interface GeminiFineTuningJob {
  name: string
  displayName: string
  state: 'STATE_PENDING' | 'STATE_RUNNING' | 'STATE_SUCCEEDED' | 'STATE_FAILED' | 'STATE_CANCELLED'
  createTime: string
  updateTime: string
  completeTime?: string
  error?: {
    code: number
    message: string
  }
  tunedModel?: {
    name: string
    displayName: string
    state: string
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
    if (path === '/gemini-fine-tuning/start' && method === 'POST') {
      const requestData = await req.json()
      return await startFineTuning(supabaseClient, user.id, requestData)
    }
    
    if (path === '/gemini-fine-tuning/status' && method === 'GET') {
      const jobId = url.searchParams.get('job_id')
      return await getFineTuningStatus(supabaseClient, user.id, jobId!)
    }
    
    if (path === '/gemini-fine-tuning/cancel' && method === 'POST') {
      const { job_id } = await req.json()
      return await cancelFineTuning(supabaseClient, user.id, job_id)
    }
    
    if (path === '/gemini-fine-tuning/models' && method === 'GET') {
      return await listFineTunedModels(supabaseClient, user.id)
    }

    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Gemini Fine-tuning Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function startFineTuning(supabaseClient: any, userId: string, requestData: FineTuningRequest) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured')
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
        logs: [...(job.logs || []), 'Starting Gemini fine-tuning process']
      })
      .eq('id', requestData.job_id)

    // Prepare training data in Gemini format
    const trainingExamples = requestData.training_data.map(item => ({
      text_input: item.input,
      output: item.output
    }))

    // Create fine-tuning job with Gemini API
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/tunedModels', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${geminiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        displayName: job.model_name,
        baseModel: `models/${requestData.model_config.base_model}`,
        tuningTask: {
          hyperparameters: {
            learningRate: requestData.model_config.learning_rate,
            epochCount: requestData.model_config.epochs,
            batchSize: requestData.model_config.batch_size
          },
          trainingData: {
            examples: {
              examples: trainingExamples
            }
          }
        }
      })
    })

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const geminiJob: GeminiFineTuningJob = await geminiResponse.json()

    // Update job with Gemini job details
    await supabaseClient
      .from('fine_tuning_jobs')
      .update({
        status: 'training',
        current_phase: 'training',
        model_id: geminiJob.name,
        logs: [...(job.logs || []), `Gemini fine-tuning job created: ${geminiJob.name}`],
        config: {
          ...job.config,
          gemini_job_name: geminiJob.name,
          gemini_display_name: geminiJob.displayName
        }
      })
      .eq('id', requestData.job_id)

    // Start monitoring the job
    monitorGeminiJob(supabaseClient, requestData.job_id, geminiJob.name)

    // Log the API usage
    await supabaseClient
      .from('api_usage')
      .insert({
        user_id: userId,
        endpoint: '/gemini-fine-tuning/start',
        method: 'POST',
        tokens_used: trainingExamples.length * 100, // Estimate
        status_code: 200,
        metadata: {
          job_id: requestData.job_id,
          training_examples: trainingExamples.length,
          model: requestData.model_config.base_model
        }
      })

    return new Response(
      JSON.stringify({
        message: 'Fine-tuning started successfully',
        gemini_job_id: geminiJob.name,
        status: geminiJob.state
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
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured')
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

  if (!job.model_id) {
    return new Response(
      JSON.stringify({
        job_id: jobId,
        status: job.status,
        progress: job.progress,
        message: 'Job not yet started with Gemini'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Get status from Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${job.model_id}`, {
      headers: {
        'Authorization': `Bearer ${geminiApiKey}`
      }
    })

    if (!geminiResponse.ok) {
      throw new Error('Failed to get status from Gemini API')
    }

    const geminiJob: GeminiFineTuningJob = await geminiResponse.json()

    // Update local job status based on Gemini status
    let localStatus = job.status
    let progress = job.progress

    switch (geminiJob.state) {
      case 'STATE_PENDING':
        localStatus = 'preparing'
        progress = 10
        break
      case 'STATE_RUNNING':
        localStatus = 'training'
        progress = 50
        break
      case 'STATE_SUCCEEDED':
        localStatus = 'completed'
        progress = 100
        break
      case 'STATE_FAILED':
        localStatus = 'failed'
        break
      case 'STATE_CANCELLED':
        localStatus = 'cancelled'
        break
    }

    // Update job in database
    await supabaseClient
      .from('fine_tuning_jobs')
      .update({
        status: localStatus,
        progress: progress,
        ...(geminiJob.state === 'STATE_SUCCEEDED' && {
          completed_at: new Date().toISOString(),
          deployment_ready: true
        }),
        ...(geminiJob.state === 'STATE_FAILED' && {
          completed_at: new Date().toISOString(),
          error_logs: [...(job.error_logs || []), geminiJob.error?.message || 'Unknown error']
        })
      })
      .eq('id', jobId)

    return new Response(
      JSON.stringify({
        job_id: jobId,
        status: localStatus,
        progress: progress,
        gemini_status: geminiJob.state,
        gemini_job_id: job.model_id,
        created_time: geminiJob.createTime,
        updated_time: geminiJob.updateTime,
        completed_time: geminiJob.completeTime,
        error: geminiJob.error
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error getting Gemini status:', error)
    
    return new Response(
      JSON.stringify({
        job_id: jobId,
        status: job.status,
        progress: job.progress,
        error: 'Failed to get status from Gemini API'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function cancelFineTuning(supabaseClient: any, userId: string, jobId: string) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured')
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

  if (!job.model_id) {
    // Job hasn't started with Gemini yet, just cancel locally
    await supabaseClient
      .from('fine_tuning_jobs')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        logs: [...(job.logs || []), 'Job cancelled before Gemini processing']
      })
      .eq('id', jobId)

    return new Response(
      JSON.stringify({ message: 'Job cancelled successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Cancel with Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${job.model_id}:cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${geminiApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    // Update job in database
    await supabaseClient
      .from('fine_tuning_jobs')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        logs: [...(job.logs || []), 'Job cancelled via Gemini API']
      })
      .eq('id', jobId)

    return new Response(
      JSON.stringify({ message: 'Job cancelled successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error cancelling Gemini job:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function listFineTunedModels(supabaseClient: any, userId: string) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured')
  }

  try {
    // Get models from Gemini API
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/tunedModels', {
      headers: {
        'Authorization': `Bearer ${geminiApiKey}`
      }
    })

    if (!geminiResponse.ok) {
      throw new Error('Failed to get models from Gemini API')
    }

    const geminiData = await geminiResponse.json()
    const models = geminiData.tunedModels || []

    // Get user's jobs from database
    const { data: userJobs, error: jobsError } = await supabaseClient
      .from('fine_tuning_jobs')
      .select('id, model_id, model_name')
      .eq('created_by', userId)

    if (jobsError) {
      throw new Error('Failed to get user jobs')
    }

    // Match Gemini models with user's jobs
    const matchedModels = models.map((model: any) => {
      const matchingJob = userJobs.find((job: any) => job.model_id === model.name)
      return {
        ...model,
        job_id: matchingJob?.id,
        job_model_name: matchingJob?.model_name
      }
    })

    return new Response(
      JSON.stringify({ models: matchedModels }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error listing Gemini models:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function monitorGeminiJob(supabaseClient: any, jobId: string, geminiJobName: string) {
  // This would be implemented as a background process in a production environment
  // For this example, we'll simulate periodic polling
  
  const checkStatus = async () => {
    try {
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
      if (!geminiApiKey) return

      // Get job from Gemini API
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${geminiJobName}`, {
        headers: {
          'Authorization': `Bearer ${geminiApiKey}`
        }
      })

      if (!geminiResponse.ok) return
      
      const geminiJob: GeminiFineTuningJob = await geminiResponse.json()
      
      // Update job status in database
      let localStatus = 'training'
      let progress = 50
      let completed = false

      switch (geminiJob.state) {
        case 'STATE_PENDING':
          localStatus = 'preparing'
          progress = 10
          break
        case 'STATE_RUNNING':
          localStatus = 'training'
          progress = 50
          break
        case 'STATE_SUCCEEDED':
          localStatus = 'completed'
          progress = 100
          completed = true
          break
        case 'STATE_FAILED':
          localStatus = 'failed'
          completed = true
          break
        case 'STATE_CANCELLED':
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
          ...(geminiJob.state === 'STATE_SUCCEEDED' && {
            deployment_ready: true,
            model_artifacts: {
              model_name: geminiJob.tunedModel?.name,
              display_name: geminiJob.tunedModel?.displayName
            }
          }),
          ...(geminiJob.state === 'STATE_FAILED' && {
            error_logs: [geminiJob.error?.message || 'Unknown error']
          }),
          logs: [
            ...(await getCurrentLogs(supabaseClient, jobId)),
            `Gemini job status: ${geminiJob.state} at ${new Date().toISOString()}`
          ]
        })
        .eq('id', jobId)

      // If job is still running, check again later
      if (!completed) {
        setTimeout(checkStatus, 60000) // Check every minute
      }
    } catch (error) {
      console.error('Error monitoring Gemini job:', error)
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