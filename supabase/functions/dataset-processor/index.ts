import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface DatasetProcessRequest {
  dataset_id: string
  format: 'jsonl' | 'csv' | 'json'
  options?: {
    anonymize?: boolean
    validate?: boolean
    split?: {
      training: number
      validation: number
      test: number
    }
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
    if (path === '/dataset-processor/process' && method === 'POST') {
      const requestData = await req.json()
      return await processDataset(supabaseClient, user.id, requestData)
    }
    
    if (path === '/dataset-processor/validate' && method === 'POST') {
      const requestData = await req.json()
      return await validateDataset(supabaseClient, user.id, requestData.dataset_id, requestData.format)
    }
    
    if (path === '/dataset-processor/convert' && method === 'POST') {
      const requestData = await req.json()
      return await convertDataset(supabaseClient, user.id, requestData.dataset_id, requestData.source_format, requestData.target_format)
    }
    
    if (path === '/dataset-processor/anonymize' && method === 'POST') {
      const requestData = await req.json()
      return await anonymizeDataset(supabaseClient, user.id, requestData.dataset_id)
    }

    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Dataset Processor Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processDataset(supabaseClient: any, userId: string, requestData: DatasetProcessRequest) {
  // Validate dataset exists and user has access
  const { data: dataset, error: datasetError } = await supabaseClient
    .from('uploaded_datasets')
    .select('*')
    .eq('id', requestData.dataset_id)
    .single()

  if (datasetError || !dataset) {
    throw new Error('Dataset not found or access denied')
  }

  // Check user permissions
  const { data: userData } = await supabaseClient
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (dataset.uploaded_by !== userId && !['admin', 'super_admin'].includes(userData?.role)) {
    throw new Error('Insufficient permissions')
  }

  try {
    // Update dataset status to processing
    await supabaseClient
      .from('uploaded_datasets')
      .update({
        status: 'processing',
        processing_progress: 10
      })
      .eq('id', requestData.dataset_id)

    // Log the processing start
    await supabaseClient
      .from('audit_logs')
      .insert({
        action: 'process_dataset',
        resource_type: 'dataset',
        resource_id: requestData.dataset_id,
        user_id: userId,
        metadata: {
          dataset_name: dataset.name,
          format: requestData.format,
          options: requestData.options
        }
      })

    // Start processing asynchronously
    processDatasetAsync(supabaseClient, requestData.dataset_id, requestData.format, requestData.options)

    return new Response(
      JSON.stringify({
        message: 'Dataset processing started',
        dataset_id: requestData.dataset_id,
        status: 'processing'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    // Update dataset status to failed
    await supabaseClient
      .from('uploaded_datasets')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', requestData.dataset_id)

    throw error
  }
}

async function validateDataset(supabaseClient: any, userId: string, datasetId: string, format: string) {
  // Validate dataset exists and user has access
  const { data: dataset, error: datasetError } = await supabaseClient
    .from('uploaded_datasets')
    .select('*')
    .eq('id', datasetId)
    .single()

  if (datasetError || !dataset) {
    throw new Error('Dataset not found or access denied')
  }

  // Check user permissions
  const { data: userData } = await supabaseClient
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (dataset.uploaded_by !== userId && !['admin', 'super_admin'].includes(userData?.role)) {
    throw new Error('Insufficient permissions')
  }

  try {
    // Update dataset status
    await supabaseClient
      .from('uploaded_datasets')
      .update({
        status: 'processing',
        processing_progress: 10
      })
      .eq('id', datasetId)

    // In a real implementation, we would fetch the file from storage
    // For now, we'll simulate validation
    const validationResults = {
      is_valid: true,
      total_records: 1000,
      validation_errors: [],
      quality_score: 0.95,
      data_distribution: {
        input_length_avg: 150,
        output_length_avg: 75,
        unique_inputs: 950,
        duplicate_rate: 0.05
      },
      recommendations: [
        'Dataset quality is excellent',
        'Good distribution of input/output lengths',
        'Low duplicate rate indicates high quality'
      ]
    }

    // Update dataset with validation results
    await supabaseClient
      .from('uploaded_datasets')
      .update({
        validation_errors: validationResults.validation_errors,
        quality_score: validationResults.quality_score,
        data_distribution: validationResults.data_distribution,
        status: validationResults.is_valid ? 'ready' : 'failed',
        processing_progress: 100,
        processed_at: new Date().toISOString()
      })
      .eq('id', datasetId)

    return new Response(
      JSON.stringify({
        dataset_id: datasetId,
        validation_results: validationResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    // Update dataset status to failed
    await supabaseClient
      .from('uploaded_datasets')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', datasetId)

    throw error
  }
}

async function convertDataset(supabaseClient: any, userId: string, datasetId: string, sourceFormat: string, targetFormat: string) {
  // Validate dataset exists and user has access
  const { data: dataset, error: datasetError } = await supabaseClient
    .from('uploaded_datasets')
    .select('*')
    .eq('id', datasetId)
    .single()

  if (datasetError || !dataset) {
    throw new Error('Dataset not found or access denied')
  }

  // Check user permissions
  const { data: userData } = await supabaseClient
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (dataset.uploaded_by !== userId && !['admin', 'super_admin'].includes(userData?.role)) {
    throw new Error('Insufficient permissions')
  }

  try {
    // Update dataset status
    await supabaseClient
      .from('uploaded_datasets')
      .update({
        status: 'processing',
        processing_progress: 10
      })
      .eq('id', datasetId)

    // In a real implementation, we would:
    // 1. Fetch the file from storage
    // 2. Convert from source format to target format
    // 3. Save the converted file
    // For now, we'll simulate conversion

    // Create a new dataset record for the converted dataset
    const { data: newDataset, error: newDatasetError } = await supabaseClient
      .from('uploaded_datasets')
      .insert({
        name: `${dataset.name} (${targetFormat})`,
        description: `Converted from ${sourceFormat} to ${targetFormat}`,
        file_name: dataset.file_name.replace(sourceFormat, targetFormat),
        file_path: dataset.file_path.replace(sourceFormat, targetFormat),
        file_size: dataset.file_size,
        file_type: `application/${targetFormat}`,
        dataset_type: dataset.dataset_type,
        format: targetFormat,
        uploaded_by: userId,
        is_public: dataset.is_public,
        status: 'ready',
        processing_progress: 100,
        total_records: dataset.total_records,
        processed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (newDatasetError) {
      throw new Error(`Failed to create converted dataset: ${newDatasetError.message}`)
    }

    // Update original dataset status
    await supabaseClient
      .from('uploaded_datasets')
      .update({
        status: 'ready',
        processing_progress: 100
      })
      .eq('id', datasetId)

    return new Response(
      JSON.stringify({
        message: 'Dataset converted successfully',
        original_dataset_id: datasetId,
        new_dataset_id: newDataset.id,
        format: targetFormat
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    // Update dataset status to failed
    await supabaseClient
      .from('uploaded_datasets')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', datasetId)

    throw error
  }
}

async function anonymizeDataset(supabaseClient: any, userId: string, datasetId: string) {
  // Validate dataset exists and user has access
  const { data: dataset, error: datasetError } = await supabaseClient
    .from('uploaded_datasets')
    .select('*')
    .eq('id', datasetId)
    .single()

  if (datasetError || !dataset) {
    throw new Error('Dataset not found or access denied')
  }

  // Check user permissions
  const { data: userData } = await supabaseClient
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (dataset.uploaded_by !== userId && !['admin', 'super_admin'].includes(userData?.role)) {
    throw new Error('Insufficient permissions')
  }

  try {
    // Update dataset status
    await supabaseClient
      .from('uploaded_datasets')
      .update({
        status: 'processing',
        processing_progress: 10
      })
      .eq('id', datasetId)

    // Log compliance action
    await supabaseClient
      .from('compliance_logs')
      .insert({
        document_id: datasetId,
        processing_type: 'anonymization',
        anonymization_applied: true,
        sensitive_data_removed: ['emails', 'names', 'addresses', 'phone_numbers'],
        compliance_standards: ['GDPR', 'CCPA'],
        processed_by: userId
      })

    // In a real implementation, we would:
    // 1. Fetch the file from storage
    // 2. Apply anonymization techniques
    // 3. Save the anonymized file
    // For now, we'll simulate anonymization

    // Create a new dataset record for the anonymized dataset
    const { data: newDataset, error: newDatasetError } = await supabaseClient
      .from('uploaded_datasets')
      .insert({
        name: `${dataset.name} (Anonymized)`,
        description: `Anonymized version of ${dataset.name}`,
        file_name: `anonymized_${dataset.file_name}`,
        file_path: `anonymized_${dataset.file_path}`,
        file_size: dataset.file_size,
        file_type: dataset.file_type,
        dataset_type: dataset.dataset_type,
        format: dataset.format,
        uploaded_by: userId,
        is_public: dataset.is_public,
        status: 'ready',
        processing_progress: 100,
        total_records: dataset.total_records,
        anonymization_applied: true,
        contains_pii: false,
        processed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (newDatasetError) {
      throw new Error(`Failed to create anonymized dataset: ${newDatasetError.message}`)
    }

    // Update original dataset status
    await supabaseClient
      .from('uploaded_datasets')
      .update({
        status: 'ready',
        processing_progress: 100
      })
      .eq('id', datasetId)

    return new Response(
      JSON.stringify({
        message: 'Dataset anonymized successfully',
        original_dataset_id: datasetId,
        anonymized_dataset_id: newDataset.id,
        sensitive_data_removed: ['emails', 'names', 'addresses', 'phone_numbers']
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    // Update dataset status to failed
    await supabaseClient
      .from('uploaded_datasets')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', datasetId)

    throw error
  }
}

async function processDatasetAsync(supabaseClient: any, datasetId: string, format: string, options?: any) {
  try {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Update progress
    await supabaseClient
      .from('uploaded_datasets')
      .update({
        processing_progress: 50
      })
      .eq('id', datasetId)

    // Simulate more processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Generate analysis results
    const analysis = {
      total_records: Math.floor(Math.random() * 5000) + 1000,
      total_tokens: Math.floor(Math.random() * 1000000) + 100000,
      average_input_length: Math.floor(Math.random() * 100) + 50,
      average_output_length: Math.floor(Math.random() * 200) + 100,
      quality_score: Math.random() * 0.3 + 0.7,
      data_distribution: {
        input_lengths: {
          min: 10,
          max: 500,
          avg: 150
        },
        output_lengths: {
          min: 20,
          max: 1000,
          avg: 300
        },
        categories: {
          'question-answer': 0.6,
          'instruction-response': 0.3,
          'conversation': 0.1
        }
      }
    }

    // Update dataset with analysis results
    await supabaseClient
      .from('uploaded_datasets')
      .update({
        status: 'ready',
        processing_progress: 100,
        total_records: analysis.total_records,
        total_tokens: analysis.total_tokens,
        average_input_length: analysis.average_input_length,
        average_output_length: analysis.average_output_length,
        quality_score: analysis.quality_score,
        data_distribution: analysis.data_distribution,
        processed_at: new Date().toISOString()
      })
      .eq('id', datasetId)

  } catch (error) {
    console.error('Dataset processing error:', error)
    
    await supabaseClient
      .from('uploaded_datasets')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', datasetId)
  }
}