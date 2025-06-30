import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

interface EmbeddingRequest {
  document_id: string;
  chunk_size?: number;
  chunk_overlap?: number;
  embedding_model?: string;
}

interface SearchRequest {
  query: string;
  limit?: number;
  similarity_threshold?: number;
  filter?: {
    document_types?: string[];
    categories?: string[];
    date_range?: {
      start?: string;
      end?: string;
    };
  };
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

    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // Route handling
    if (path === '/document-embeddings/generate' && method === 'POST') {
      const requestData = await req.json()
      return await generateEmbeddings(supabaseClient, user.id, requestData)
    }
    
    if (path === '/document-embeddings/search' && method === 'POST') {
      const requestData = await req.json()
      return await searchDocuments(supabaseClient, user.id, requestData)
    }
    
    if (path === '/document-embeddings/status' && method === 'GET') {
      const documentId = url.searchParams.get('document_id')
      return await getEmbeddingStatus(supabaseClient, user.id, documentId!)
    }
    
    if (path === '/document-embeddings/delete' && method === 'DELETE') {
      const documentId = url.searchParams.get('document_id')
      return await deleteEmbeddings(supabaseClient, user.id, documentId!)
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

async function generateEmbeddings(supabaseClient: any, userId: string, requestData: EmbeddingRequest) {
  // Validate request
  if (!requestData.document_id) {
    throw new Error('Missing document_id')
  }

  // Get document
  const { data: document, error: documentError } = await supabaseClient
    .from('legal_documents')
    .select('*')
    .eq('id', requestData.document_id)
    .single()

  if (documentError || !document) {
    throw new Error('Document not found')
  }

  // Check if embeddings already exist
  const { count: existingCount } = await supabaseClient
    .from('document_embeddings')
    .select('*', { count: 'exact', head: true })
    .eq('document_id', requestData.document_id)

  if (existingCount > 0) {
    return new Response(
      JSON.stringify({ 
        message: 'Embeddings already exist for this document',
        document_id: requestData.document_id,
        chunks: existingCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get default embedding model
  const { data: embeddingModel } = await supabaseClient
    .from('embedding_models')
    .select('*')
    .eq('is_default', true)
    .single()

  const modelName = requestData.embedding_model || embeddingModel?.name || 'embedding-001'
  
  // Chunk the document
  const chunkSize = requestData.chunk_size || 1000
  const chunkOverlap = requestData.chunk_overlap || 200
  const chunks = chunkDocument(document.content, chunkSize, chunkOverlap)

  // Generate embeddings for each chunk
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured')
  }

  // Process chunks in batches to avoid rate limits
  const batchSize = 5
  const batches = []
  for (let i = 0; i < chunks.length; i += batchSize) {
    batches.push(chunks.slice(i, i + batchSize))
  }

  let processedChunks = 0
  for (const batch of batches) {
    const embeddingPromises = batch.map(async (chunk, index) => {
      const chunkIndex = processedChunks + index
      
      try {
        const embedding = await getGeminiEmbedding(chunk, modelName, geminiApiKey)
        
        // Store embedding in database
        await supabaseClient
          .from('document_embeddings')
          .insert({
            document_id: requestData.document_id,
            chunk_index: chunkIndex,
            chunk_text: chunk,
            embedding: embedding,
            metadata: {
              model: modelName,
              chunk_size: chunkSize,
              chunk_overlap: chunkOverlap
            }
          })
        
        return { success: true, chunk_index: chunkIndex }
      } catch (error) {
        console.error(`Error generating embedding for chunk ${chunkIndex}:`, error)
        return { success: false, chunk_index: chunkIndex, error: error.message }
      }
    })
    
    await Promise.all(embeddingPromises)
    processedChunks += batch.length
    
    // Small delay to avoid rate limits
    if (batches.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Store document metadata
  await supabaseClient
    .from('document_metadata')
    .insert({
      document_id: requestData.document_id,
      title: document.title,
      description: `${document.document_type} document from ${document.jurisdiction}`,
      source: document.source,
      language: document.language,
      categories: [document.document_type],
      keywords: extractKeywords(document.content)
    })
    .onConflict('document_id')
    .merge()

  // Log the operation
  await supabaseClient
    .from('audit_logs')
    .insert({
      action: 'generate_embeddings',
      resource_type: 'document',
      resource_id: requestData.document_id,
      user_id: userId,
      metadata: {
        document_title: document.title,
        chunk_count: chunks.length,
        embedding_model: modelName
      }
    })

  return new Response(
    JSON.stringify({
      message: 'Embeddings generated successfully',
      document_id: requestData.document_id,
      chunks: chunks.length,
      model: modelName
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function searchDocuments(supabaseClient: any, userId: string, requestData: SearchRequest) {
  // Validate request
  if (!requestData.query) {
    throw new Error('Missing query')
  }

  const limit = requestData.limit || 5
  const similarityThreshold = requestData.similarity_threshold || 0.7

  // Get query embedding
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured')
  }

  const startTime = Date.now()
  const queryEmbedding = await getGeminiEmbedding(requestData.query, 'embedding-001', geminiApiKey)

  // Build the query
  let query = supabaseClient.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: similarityThreshold,
    match_count: limit
  })

  // Apply filters if provided
  if (requestData.filter) {
    if (requestData.filter.document_types && requestData.filter.document_types.length > 0) {
      query = query.in('document_type', requestData.filter.document_types)
    }
    
    if (requestData.filter.categories && requestData.filter.categories.length > 0) {
      query = query.contains('categories', requestData.filter.categories)
    }
    
    if (requestData.filter.date_range) {
      if (requestData.filter.date_range.start) {
        query = query.gte('publication_date', requestData.filter.date_range.start)
      }
      
      if (requestData.filter.date_range.end) {
        query = query.lte('publication_date', requestData.filter.date_range.end)
      }
    }
  }

  // Execute the query
  const { data: results, error } = await query

  if (error) {
    throw new Error(`Search failed: ${error.message}`)
  }

  const executionTime = Date.now() - startTime

  // Log the search
  await supabaseClient
    .from('vector_search_logs')
    .insert({
      user_id: userId,
      query: requestData.query,
      embedding: queryEmbedding,
      num_results: limit,
      similarity_threshold: similarityThreshold,
      filter_criteria: requestData.filter || {},
      execution_time_ms: executionTime,
      result_ids: results.map((r: any) => r.id)
    })

  return new Response(
    JSON.stringify({
      results,
      execution_time_ms: executionTime,
      query: requestData.query
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getEmbeddingStatus(supabaseClient: any, userId: string, documentId: string) {
  // Check if document exists
  const { data: document, error: documentError } = await supabaseClient
    .from('legal_documents')
    .select('title')
    .eq('id', documentId)
    .single()

  if (documentError) {
    throw new Error('Document not found')
  }

  // Get embedding count
  const { count, error: countError } = await supabaseClient
    .from('document_embeddings')
    .select('*', { count: 'exact', head: true })
    .eq('document_id', documentId)

  if (countError) {
    throw new Error(`Failed to get embedding status: ${countError.message}`)
  }

  return new Response(
    JSON.stringify({
      document_id: documentId,
      document_title: document.title,
      has_embeddings: count > 0,
      chunk_count: count
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteEmbeddings(supabaseClient: any, userId: string, documentId: string) {
  // Check if document exists
  const { data: document, error: documentError } = await supabaseClient
    .from('legal_documents')
    .select('title')
    .eq('id', documentId)
    .single()

  if (documentError) {
    throw new Error('Document not found')
  }

  // Delete embeddings
  const { error: deleteError } = await supabaseClient
    .from('document_embeddings')
    .delete()
    .eq('document_id', documentId)

  if (deleteError) {
    throw new Error(`Failed to delete embeddings: ${deleteError.message}`)
  }

  // Delete metadata
  await supabaseClient
    .from('document_metadata')
    .delete()
    .eq('document_id', documentId)

  // Log the operation
  await supabaseClient
    .from('audit_logs')
    .insert({
      action: 'delete_embeddings',
      resource_type: 'document',
      resource_id: documentId,
      user_id: userId,
      metadata: {
        document_title: document.title
      }
    })

  return new Response(
    JSON.stringify({
      message: 'Embeddings deleted successfully',
      document_id: documentId
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Helper function to chunk document
function chunkDocument(text: string, chunkSize: number, chunkOverlap: number): string[] {
  const chunks: string[] = []
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/)
  
  let currentChunk = ''
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size, save current chunk and start a new one
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      
      // Start new chunk with overlap from previous chunk
      const words = currentChunk.split(' ')
      const overlapWords = words.slice(-Math.floor(chunkOverlap / 5)) // Approximate words for overlap
      currentChunk = overlapWords.join(' ') + ' ' + paragraph
    } else {
      // Add paragraph to current chunk
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

// Helper function to get embedding from Gemini API
async function getGeminiEmbedding(text: string, model: string, apiKey: string): Promise<number[]> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: {
        parts: [{
          text: text
        }]
      }
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  return data.embedding.values
}

// Helper function to extract keywords from text
function extractKeywords(text: string): string[] {
  // Simple keyword extraction based on frequency
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
  const wordCounts: Record<string, number> = {}
  
  // Count word frequencies
  for (const word of words) {
    if (!commonWords.includes(word)) {
      wordCounts[word] = (wordCounts[word] || 0) + 1
    }
  }
  
  // Sort by frequency and take top 10
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}

// Common words to exclude from keywords
const commonWords = [
  'this', 'that', 'these', 'those', 'with', 'from', 'have', 'will',
  'would', 'could', 'should', 'their', 'there', 'where', 'which',
  'when', 'what', 'who', 'whom', 'whose', 'they', 'them', 'been',
  'were', 'shall', 'about', 'into', 'such', 'than', 'then', 'some'
]