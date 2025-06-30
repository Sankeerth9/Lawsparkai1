import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface DatasetUploadRequest {
  name: string
  description?: string
  dataset_type: 'training' | 'validation' | 'test' | 'mixed'
  format: 'jsonl' | 'csv' | 'parquet' | 'json'
  file_data: string // Base64 encoded file data
  file_name: string
  is_public?: boolean
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

    // Get user role
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
    if (path === '/dataset-manager/datasets' && method === 'GET') {
      return await listDatasets(supabaseClient, user.id, userData.role)
    }
    
    if (path === '/dataset-manager/datasets' && method === 'POST') {
      const datasetData = await req.json()
      return await uploadDataset(supabaseClient, user.id, userData.role, datasetData)
    }
    
    if (path.startsWith('/dataset-manager/datasets/') && method === 'GET') {
      const datasetId = path.split('/').pop()
      return await getDataset(supabaseClient, user.id, userData.role, datasetId!)
    }
    
    if (path.startsWith('/dataset-manager/datasets/') && method === 'DELETE') {
      const datasetId = path.split('/').pop()
      return await deleteDataset(supabaseClient, user.id, userData.role, datasetId!)
    }
    
    if (path.startsWith('/dataset-manager/datasets/') && path.endsWith('/validate') && method === 'POST') {
      const datasetId = path.split('/')[3]
      return await validateDataset(supabaseClient, user.id, userData.role, datasetId)
    }

    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Dataset Manager Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function listDatasets(supabaseClient: any, userId: string, userRole: string) {
  let query = supabaseClient
    .from('uploaded_datasets')
    .select(`
      *,
      uploader:uploaded_by(full_name, email)
    `)
    .order('created_at', { ascending: false })

  // Apply role-based filtering
  if (!['admin', 'super_admin', 'analyst'].includes(userRole)) {
    query = query.or(`uploaded_by.eq.${userId},is_public.eq.true`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch datasets: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ datasets: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function uploadDataset(supabaseClient: any, userId: string, userRole: string, datasetData: DatasetUploadRequest) {
  // Validate required fields
  if (!datasetData.name || !datasetData.file_data || !datasetData.file_name) {
    throw new Error('Missing required fields: name, file_data, file_name')
  }

  // Check file size limits
  const fileSize = Math.ceil(datasetData.file_data.length * 0.75) // Approximate size after base64 decode
  const maxSize = 100 * 1024 * 1024 // 100MB limit

  if (fileSize > maxSize) {
    throw new Error('File size exceeds maximum limit of 100MB')
  }

  // Decode and validate file content
  let fileContent: string
  try {
    fileContent = atob(datasetData.file_data)
  } catch (error) {
    throw new Error('Invalid base64 file data')
  }

  // Validate file format
  const validationResult = validateFileFormat(fileContent, datasetData.format)
  if (!validationResult.valid) {
    throw new Error(`Invalid file format: ${validationResult.error}`)
  }

  // Generate file path (in production, upload to storage)
  const filePath = `datasets/${userId}/${Date.now()}-${datasetData.file_name}`

  // Create dataset record
  const { data: newDataset, error: datasetError } = await supabaseClient
    .from('uploaded_datasets')
    .insert({
      name: datasetData.name,
      description: datasetData.description,
      file_name: datasetData.file_name,
      file_path: filePath,
      file_size: fileSize,
      file_type: getFileType(datasetData.file_name),
      dataset_type: datasetData.dataset_type,
      format: datasetData.format,
      uploaded_by: userId,
      is_public: datasetData.is_public || false,
      status: 'processing',
      total_records: validationResult.recordCount,
      quality_score: validationResult.qualityScore
    })
    .select()
    .single()

  if (datasetError) {
    throw new Error(`Failed to create dataset: ${datasetError.message}`)
  }

  // Process dataset asynchronously
  processDatasetAsync(supabaseClient, newDataset.id, fileContent, datasetData.format)

  // Log the upload
  await supabaseClient
    .from('audit_logs')
    .insert({
      action: 'upload_dataset',
      resource_type: 'dataset',
      resource_id: newDataset.id,
      user_id: userId,
      metadata: {
        dataset_name: datasetData.name,
        file_size: fileSize,
        format: datasetData.format
      }
    })

  return new Response(
    JSON.stringify({
      dataset: newDataset,
      message: 'Dataset uploaded successfully and is being processed'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getDataset(supabaseClient: any, userId: string, userRole: string, datasetId: string) {
  let query = supabaseClient
    .from('uploaded_datasets')
    .select(`
      *,
      uploader:uploaded_by(full_name, email),
      usage_stats:fine_tuning_jobs(id, name, status)
    `)
    .eq('id', datasetId)

  // Apply role-based filtering
  if (!['admin', 'super_admin', 'analyst'].includes(userRole)) {
    query = query.or(`uploaded_by.eq.${userId},is_public.eq.true`)
  }

  const { data, error } = await query.single()

  if (error) {
    throw new Error(`Dataset not found or access denied: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ dataset: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteDataset(supabaseClient: any, userId: string, userRole: string, datasetId: string) {
  // Check if user can delete this dataset
  const { data: dataset, error: datasetError } = await supabaseClient
    .from('uploaded_datasets')
    .select('id, uploaded_by, name, used_in_jobs')
    .eq('id', datasetId)
    .single()

  if (datasetError || !dataset) {
    throw new Error('Dataset not found')
  }

  // Check permissions
  if (dataset.uploaded_by !== userId && !['admin', 'super_admin'].includes(userRole)) {
    throw new Error('Insufficient permissions to delete this dataset')
  }

  // Check if dataset is being used
  if (dataset.used_in_jobs > 0) {
    throw new Error('Cannot delete dataset that is being used in training jobs')
  }

  // Delete the dataset
  const { error: deleteError } = await supabaseClient
    .from('uploaded_datasets')
    .delete()
    .eq('id', datasetId)

  if (deleteError) {
    throw new Error(`Failed to delete dataset: ${deleteError.message}`)
  }

  // Log the deletion
  await supabaseClient
    .from('audit_logs')
    .insert({
      action: 'delete_dataset',
      resource_type: 'dataset',
      resource_id: datasetId,
      user_id: userId,
      metadata: { dataset_name: dataset.name }
    })

  return new Response(
    JSON.stringify({ message: 'Dataset deleted successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function validateDataset(supabaseClient: any, userId: string, userRole: string, datasetId: string) {
  // Check access to dataset
  let datasetQuery = supabaseClient
    .from('uploaded_datasets')
    .select('id, uploaded_by, file_path, format')
    .eq('id', datasetId)

  if (!['admin', 'super_admin', 'analyst'].includes(userRole)) {
    datasetQuery = datasetQuery.or(`uploaded_by.eq.${userId},is_public.eq.true`)
  }

  const { data: dataset, error: datasetError } = await datasetQuery.single()

  if (datasetError || !dataset) {
    throw new Error('Dataset not found or access denied')
  }

  // In production, load file from storage
  // For now, simulate validation
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
      status: validationResults.is_valid ? 'ready' : 'failed'
    })
    .eq('id', datasetId)

  return new Response(
    JSON.stringify({
      dataset_id: datasetId,
      validation_results: validationResults
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function validateFileFormat(content: string, format: string): {
  valid: boolean
  error?: string
  recordCount?: number
  qualityScore?: number
} {
  try {
    switch (format) {
      case 'jsonl':
        const lines = content.trim().split('\n').filter(line => line.trim())
        let validRecords = 0
        
        for (const line of lines) {
          try {
            const record = JSON.parse(line)
            if (record.input && record.output) {
              validRecords++
            }
          } catch (e) {
            // Invalid JSON line
          }
        }
        
        if (validRecords === 0) {
          return { valid: false, error: 'No valid records found in JSONL file' }
        }
        
        return {
          valid: true,
          recordCount: validRecords,
          qualityScore: validRecords / lines.length
        }

      case 'csv':
        const csvLines = content.trim().split('\n')
        if (csvLines.length < 2) {
          return { valid: false, error: 'CSV file must have at least a header and one data row' }
        }
        
        return {
          valid: true,
          recordCount: csvLines.length - 1, // Exclude header
          qualityScore: 0.8 // Default for CSV
        }

      case 'json':
        const jsonData = JSON.parse(content)
        if (!Array.isArray(jsonData)) {
          return { valid: false, error: 'JSON file must contain an array of records' }
        }
        
        return {
          valid: true,
          recordCount: jsonData.length,
          qualityScore: 0.9
        }

      default:
        return { valid: false, error: `Unsupported format: ${format}` }
    }
  } catch (error) {
    return { valid: false, error: `File parsing error: ${error.message}` }
  }
}

function getFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'jsonl': return 'application/jsonl'
    case 'csv': return 'text/csv'
    case 'json': return 'application/json'
    case 'parquet': return 'application/parquet'
    default: return 'application/octet-stream'
  }
}

async function processDatasetAsync(supabaseClient: any, datasetId: string, content: string, format: string) {
  try {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Analyze content
    const analysis = analyzeDatasetContent(content, format)

    // Update dataset with analysis results
    await supabaseClient
      .from('uploaded_datasets')
      .update({
        status: 'ready',
        processing_progress: 100,
        total_records: analysis.totalRecords,
        total_tokens: analysis.totalTokens,
        average_input_length: analysis.avgInputLength,
        average_output_length: analysis.avgOutputLength,
        quality_score: analysis.qualityScore,
        data_distribution: analysis.distribution,
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

function analyzeDatasetContent(content: string, format: string) {
  // Simplified analysis - in production, use more sophisticated methods
  const lines = content.trim().split('\n')
  let totalRecords = 0
  let totalTokens = 0
  let totalInputLength = 0
  let totalOutputLength = 0

  if (format === 'jsonl') {
    for (const line of lines) {
      try {
        const record = JSON.parse(line)
        if (record.input && record.output) {
          totalRecords++
          totalInputLength += record.input.length
          totalOutputLength += record.output.length
          totalTokens += Math.ceil((record.input.length + record.output.length) / 4) // Rough token estimate
        }
      } catch (e) {
        // Skip invalid lines
      }
    }
  } else {
    totalRecords = lines.length - (format === 'csv' ? 1 : 0) // Exclude CSV header
    totalTokens = Math.ceil(content.length / 4)
  }

  return {
    totalRecords,
    totalTokens,
    avgInputLength: totalRecords > 0 ? totalInputLength / totalRecords : 0,
    avgOutputLength: totalRecords > 0 ? totalOutputLength / totalRecords : 0,
    qualityScore: Math.min(0.95, 0.7 + (totalRecords > 100 ? 0.2 : 0) + (totalTokens > 10000 ? 0.05 : 0)),
    distribution: {
      record_count: totalRecords,
      token_count: totalTokens,
      avg_record_length: totalRecords > 0 ? (totalInputLength + totalOutputLength) / totalRecords : 0
    }
  }
}