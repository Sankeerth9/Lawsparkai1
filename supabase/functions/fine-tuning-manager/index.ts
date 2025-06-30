import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface FineTuningJobRequest {
  name: string
  description?: string
  model_name: string
  base_model: string
  training_dataset_id: string
  validation_dataset_id?: string
  hyperparameters?: Record<string, any>
  focus_areas?: string[]
  priority?: number
}

interface JobUpdateRequest {
  status?: string
  progress?: number
  current_epoch?: number
  current_step?: number
  logs?: string[]
  error_message?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    // Get user role from users table
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      throw new Error('User not found')
    }

    if (!userData.is_active) {
      throw new Error('User account is inactive')
    }

    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // Route handling
    if (path === '/fine-tuning-manager/jobs' && method === 'GET') {
      return await listJobs(supabaseClient, user.id, userData.role)
    }
    
    if (path === '/fine-tuning-manager/jobs' && method === 'POST') {
      const jobData = await req.json()
      return await createJob(supabaseClient, user.id, userData.role, jobData)
    }
    
    if (path.startsWith('/fine-tuning-manager/jobs/') && method === 'GET') {
      const jobId = path.split('/').pop()
      return await getJob(supabaseClient, user.id, userData.role, jobId!)
    }
    
    if (path.startsWith('/fine-tuning-manager/jobs/') && path.endsWith('/cancel') && method === 'POST') {
      const jobId = path.split('/')[3]
      return await cancelJob(supabaseClient, user.id, userData.role, jobId)
    }
    
    if (path.startsWith('/fine-tuning-manager/jobs/') && path.endsWith('/statistics') && method === 'GET') {
      const jobId = path.split('/')[3]
      return await getJobStatistics(supabaseClient, user.id, userData.role, jobId)
    }
    
    if (path.startsWith('/fine-tuning-manager/jobs/') && method === 'PUT') {
      const jobId = path.split('/').pop()
      const updateData = await req.json()
      return await updateJob(supabaseClient, user.id, userData.role, jobId!, updateData)
    }

    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function listJobs(supabaseClient: any, userId: string, userRole: string) {
  let query = supabaseClient
    .from('fine_tuning_jobs')
    .select(`
      *,
      training_dataset:training_dataset_id(name, status),
      validation_dataset:validation_dataset_id(name, status),
      creator:created_by(full_name, email)
    `)
    .order('created_at', { ascending: false })

  // Apply role-based filtering
  if (!['admin', 'super_admin', 'analyst'].includes(userRole)) {
    query = query.or(`created_by.eq.${userId},team_members.cs.{${userId}}`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch jobs: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ jobs: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createJob(supabaseClient: any, userId: string, userRole: string, jobData: FineTuningJobRequest) {
  // Validate required fields
  if (!jobData.name || !jobData.model_name || !jobData.training_dataset_id) {
    throw new Error('Missing required fields: name, model_name, training_dataset_id')
  }

  // Check if user can create jobs
  if (!['admin', 'super_admin', 'analyst', 'user'].includes(userRole)) {
    throw new Error('Insufficient permissions to create jobs')
  }

  // Verify dataset exists and user has access
  const { data: dataset, error: datasetError } = await supabaseClient
    .from('uploaded_datasets')
    .select('id, status, uploaded_by')
    .eq('id', jobData.training_dataset_id)
    .single()

  if (datasetError || !dataset) {
    throw new Error('Training dataset not found')
  }

  if (dataset.status !== 'ready') {
    throw new Error('Training dataset is not ready for use')
  }

  // Check dataset access permissions
  if (dataset.uploaded_by !== userId && !['admin', 'super_admin'].includes(userRole)) {
    const { data: publicDataset } = await supabaseClient
      .from('uploaded_datasets')
      .select('is_public')
      .eq('id', jobData.training_dataset_id)
      .eq('is_public', true)
      .single()

    if (!publicDataset) {
      throw new Error('Access denied to training dataset')
    }
  }

  // Create the job
  const { data: newJob, error: jobError } = await supabaseClient
    .from('fine_tuning_jobs')
    .insert({
      name: jobData.name,
      description: jobData.description,
      model_name: jobData.model_name,
      base_model: jobData.base_model || 'gemini-1.5-flash',
      training_dataset_id: jobData.training_dataset_id,
      validation_dataset_id: jobData.validation_dataset_id,
      hyperparameters: jobData.hyperparameters || {},
      focus_areas: jobData.focus_areas || [],
      priority: jobData.priority || 5,
      created_by: userId,
      status: 'pending'
    })
    .select()
    .single()

  if (jobError) {
    throw new Error(`Failed to create job: ${jobError.message}`)
  }

  // Log the job creation
  await supabaseClient
    .from('audit_logs')
    .insert({
      action: 'create_fine_tuning_job',
      resource_type: 'fine_tuning_job',
      resource_id: newJob.id,
      user_id: userId,
      metadata: { job_name: jobData.name, model_name: jobData.model_name }
    })

  // Trigger the actual fine-tuning process
  await startFineTuningProcess(supabaseClient, newJob.id, jobData)

  return new Response(
    JSON.stringify({ job: newJob, message: 'Fine-tuning job created successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getJob(supabaseClient: any, userId: string, userRole: string, jobId: string) {
  let query = supabaseClient
    .from('fine_tuning_jobs')
    .select(`
      *,
      training_dataset:training_dataset_id(name, status, total_records),
      validation_dataset:validation_dataset_id(name, status, total_records),
      creator:created_by(full_name, email),
      latest_stats:training_statistics(*)
    `)
    .eq('id', jobId)

  // Apply role-based filtering
  if (!['admin', 'super_admin', 'analyst'].includes(userRole)) {
    query = query.or(`created_by.eq.${userId},team_members.cs.{${userId}}`)
  }

  const { data, error } = await query.single()

  if (error) {
    throw new Error(`Job not found or access denied: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ job: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function cancelJob(supabaseClient: any, userId: string, userRole: string, jobId: string) {
  // Check if user can cancel this job
  const { data: job, error: jobError } = await supabaseClient
    .from('fine_tuning_jobs')
    .select('id, created_by, status, name')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  // Check permissions
  if (job.created_by !== userId && !['admin', 'super_admin'].includes(userRole)) {
    throw new Error('Insufficient permissions to cancel this job')
  }

  // Check if job can be cancelled
  if (!['pending', 'preparing', 'training'].includes(job.status)) {
    throw new Error(`Cannot cancel job in ${job.status} status`)
  }

  // Update job status
  const { error: updateError } = await supabaseClient
    .from('fine_tuning_jobs')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      logs: [...(job.logs || []), `Job cancelled by user at ${new Date().toISOString()}`]
    })
    .eq('id', jobId)

  if (updateError) {
    throw new Error(`Failed to cancel job: ${updateError.message}`)
  }

  // Log the cancellation
  await supabaseClient
    .from('audit_logs')
    .insert({
      action: 'cancel_fine_tuning_job',
      resource_type: 'fine_tuning_job',
      resource_id: jobId,
      user_id: userId,
      metadata: { job_name: job.name, reason: 'user_requested' }
    })

  return new Response(
    JSON.stringify({ message: 'Job cancelled successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getJobStatistics(supabaseClient: any, userId: string, userRole: string, jobId: string) {
  // Check access to job
  let jobQuery = supabaseClient
    .from('fine_tuning_jobs')
    .select('id, created_by, team_members, name')
    .eq('id', jobId)

  if (!['admin', 'super_admin', 'analyst'].includes(userRole)) {
    jobQuery = jobQuery.or(`created_by.eq.${userId},team_members.cs.{${userId}}`)
  }

  const { data: job, error: jobError } = await jobQuery.single()

  if (jobError || !job) {
    throw new Error('Job not found or access denied')
  }

  // Get training statistics
  const { data: stats, error: statsError } = await supabaseClient
    .from('training_statistics')
    .select('*')
    .eq('job_id', jobId)
    .order('epoch', { ascending: true })
    .order('step', { ascending: true })

  if (statsError) {
    throw new Error(`Failed to fetch statistics: ${statsError.message}`)
  }

  // Get training logs
  const { data: logs, error: logsError } = await supabaseClient
    .from('training_logs')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (logsError) {
    throw new Error(`Failed to fetch logs: ${logsError.message}`)
  }

  // Calculate summary statistics
  const summary = calculateStatisticsSummary(stats)

  return new Response(
    JSON.stringify({
      job_id: jobId,
      statistics: stats,
      logs: logs,
      summary: summary
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateJob(supabaseClient: any, userId: string, userRole: string, jobId: string, updateData: JobUpdateRequest) {
  // Only service role or admins can update job status
  if (!['admin', 'super_admin'].includes(userRole)) {
    throw new Error('Insufficient permissions to update job')
  }

  const { error } = await supabaseClient
    .from('fine_tuning_jobs')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)

  if (error) {
    throw new Error(`Failed to update job: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ message: 'Job updated successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function startFineTuningProcess(supabaseClient: any, jobId: string, jobData: FineTuningJobRequest) {
  try {
    // Update job status to preparing
    await supabaseClient
      .from('fine_tuning_jobs')
      .update({
        status: 'preparing',
        started_at: new Date().toISOString(),
        logs: ['Job preparation started']
      })
      .eq('id', jobId)

    // In a real implementation, this would:
    // 1. Fetch the training dataset
    // 2. Prepare the data for the chosen model (Gemini, OpenAI, etc.)
    // 3. Start the actual fine-tuning process
    // 4. Monitor progress and update the database

    // For now, we'll simulate the process
    await simulateFineTuningProcess(supabaseClient, jobId, jobData)

  } catch (error) {
    console.error('Fine-tuning process error:', error)
    
    // Update job status to failed
    await supabaseClient
      .from('fine_tuning_jobs')
      .update({
        status: 'failed',
        error_logs: [error.message],
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
  }
}

async function simulateFineTuningProcess(supabaseClient: any, jobId: string, jobData: FineTuningJobRequest) {
  // This is a simulation - in production, integrate with actual ML APIs
  
  const epochs = jobData.hyperparameters?.epochs || 3
  const stepsPerEpoch = 100

  // Update to training status
  await supabaseClient
    .from('fine_tuning_jobs')
    .update({
      status: 'training',
      current_phase: 'training',
      total_epochs: epochs,
      total_steps: epochs * stepsPerEpoch,
      logs: ['Training started']
    })
    .eq('id', jobId)

  // Simulate training epochs
  for (let epoch = 1; epoch <= epochs; epoch++) {
    for (let step = 1; step <= stepsPerEpoch; step++) {
      // Simulate training metrics
      const trainingLoss = Math.max(0.1, 2.0 - (epoch * stepsPerEpoch + step) * 0.001)
      const validationLoss = trainingLoss + Math.random() * 0.1
      const accuracy = Math.min(0.95, 0.5 + (epoch * stepsPerEpoch + step) * 0.0005)

      // Insert training statistics
      await supabaseClient
        .from('training_statistics')
        .insert({
          job_id: jobId,
          epoch: epoch,
          step: step,
          phase: 'training',
          training_loss: trainingLoss,
          validation_loss: validationLoss,
          training_accuracy: accuracy,
          validation_accuracy: accuracy - 0.05,
          learning_rate: jobData.hyperparameters?.learning_rate || 0.001,
          recorded_at: new Date().toISOString()
        })

      // Update job progress
      const progress = ((epoch - 1) * stepsPerEpoch + step) / (epochs * stepsPerEpoch) * 100
      await supabaseClient
        .from('fine_tuning_jobs')
        .update({
          progress: progress,
          current_epoch: epoch,
          current_step: step,
          best_loss: trainingLoss,
          best_accuracy: accuracy
        })
        .eq('id', jobId)

      // Add training log every 10 steps
      if (step % 10 === 0) {
        await supabaseClient
          .from('training_logs')
          .insert({
            job_id: jobId,
            log_level: 'INFO',
            message: `Epoch ${epoch}, Step ${step}: loss=${trainingLoss.toFixed(4)}, accuracy=${accuracy.toFixed(4)}`,
            component: 'trainer',
            epoch: epoch,
            step: step,
            phase: 'training'
          })
      }

      // Small delay to simulate real training
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // Complete the job
  await supabaseClient
    .from('fine_tuning_jobs')
    .update({
      status: 'completed',
      current_phase: 'completion',
      progress: 100,
      completed_at: new Date().toISOString(),
      model_id: `fine-tuned-${jobId}`,
      deployment_ready: true,
      final_metrics: {
        final_loss: 0.15,
        final_accuracy: 0.92,
        training_time_minutes: epochs * 10
      },
      logs: [...(jobData.logs || []), 'Training completed successfully']
    })
    .eq('id', jobId)

  // Create model version
  await supabaseClient
    .from('model_versions')
    .insert({
      job_id: jobId,
      version_number: '1.0',
      version_name: `${jobData.model_name} v1.0`,
      description: 'Initial fine-tuned version',
      benchmark_scores: {
        accuracy: 0.92,
        f1_score: 0.89,
        precision: 0.91,
        recall: 0.87
      }
    })
}

function calculateStatisticsSummary(stats: any[]) {
  if (!stats || stats.length === 0) {
    return null
  }

  const latestStats = stats[stats.length - 1]
  const bestLoss = Math.min(...stats.filter(s => s.training_loss).map(s => s.training_loss))
  const bestAccuracy = Math.max(...stats.filter(s => s.training_accuracy).map(s => s.training_accuracy))

  return {
    total_epochs: Math.max(...stats.map(s => s.epoch)),
    total_steps: stats.length,
    best_training_loss: bestLoss,
    best_training_accuracy: bestAccuracy,
    latest_training_loss: latestStats.training_loss,
    latest_training_accuracy: latestStats.training_accuracy,
    latest_validation_loss: latestStats.validation_loss,
    latest_validation_accuracy: latestStats.validation_accuracy
  }
}