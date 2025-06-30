import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

interface RAGQueryRequest {
  query: string;
  context: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request data
    const requestData: RAGQueryRequest = await req.json()
    
    if (!requestData.query) {
      throw new Error('Missing query')
    }
    
    if (!requestData.context) {
      throw new Error('Missing context')
    }

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({
      model: requestData.model || "gemini-1.5-flash"
    })

    // Create prompt with context
    const prompt = `
You are a legal assistant with expertise in legal documents, contracts, and legal concepts.

CONTEXT INFORMATION:
${requestData.context}

USER QUERY:
${requestData.query}

Based ONLY on the context information provided above, answer the user's query.
If the context doesn't contain enough information to provide a complete answer, acknowledge this and provide the best answer possible based on the available context.
Include citations to the specific documents you reference in your answer.
If you need to make any assumptions or generalizations, clearly state them.
Format your response in a clear, professional manner.
`

    // Generate response
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: requestData.temperature || 0.2,
        maxOutputTokens: requestData.max_tokens || 1024,
      },
    })

    const response = result.response
    const answer = response.text()

    // Log the query and response
    console.log(`Query: ${requestData.query}`)
    console.log(`Answer length: ${answer.length} characters`)

    return new Response(
      JSON.stringify({
        answer,
        model: requestData.model || "gemini-1.5-flash",
        tokens: {
          prompt: Math.round(prompt.length / 4), // Rough estimate
          completion: Math.round(answer.length / 4) // Rough estimate
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('RAG Query Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})