import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Tables = Database['public']['Tables']
type ContractAnalysis = Tables['contract_analyses']['Row']
type UserSession = Tables['user_sessions']['Row']
type FineTuningJob = Tables['fine_tuning_jobs']['Row']

export class SupabaseService {
  // Contract Analysis Methods
  static async saveContractAnalysis(analysis: {
    document_name: string
    document_content: string
    overall_score: number
    risk_level: 'excellent' | 'good' | 'fair' | 'poor'
    clauses: any
    summary: any
    analysis_time: number
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('contract_analyses')
      .insert({
        ...analysis,
        analyzed_by: user?.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getContractAnalyses(limit = 10) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('contract_analyses')
        .select('*')
        .eq('analyzed_by', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching contract analyses:', error)
      return []
    }
  }

  static async getContractAnalysis(id: string) {
    const { data, error } = await supabase
      .from('contract_analyses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // User Session Methods
  static async createUserSession(sessionData: {
    session_type: 'chatbot' | 'contract_validation' | 'document_analysis'
    messages?: any
    metadata?: any
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        ...sessionData,
        user_id: user?.id,
        messages: sessionData.messages || [],
        metadata: sessionData.metadata || {}
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateUserSession(id: string, updates: {
    messages?: any
    metadata?: any
    ended_at?: string
  }) {
    const { data, error } = await supabase
      .from('user_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserSessions(limit = 20) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user sessions:', error)
      return []
    }
  }

  // Delete user session
  static async deleteUserSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId)
    
    if (error) throw error
  }

  // API Usage Tracking
  static async logApiUsage(usage: {
    endpoint: string
    method: string
    tokens_used?: number
    cost_cents?: number
    response_time_ms?: number
    status_code?: number
    error_message?: string
    metadata?: any
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('api_usage')
      .insert({
        ...usage,
        user_id: user?.id,
        tokens_used: usage.tokens_used || 0,
        cost_cents: usage.cost_cents || 0,
        response_time_ms: usage.response_time_ms || 0,
        status_code: usage.status_code || 200,
        metadata: usage.metadata || {}
      })

    if (error) throw error
    return data
  }

  // Fine-tuning Jobs (Read-only for users)
  static async getFineTuningJobs() {
    const { data, error } = await supabase
      .from('fine_tuning_jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async getFineTuningJob(id: string) {
    const { data, error } = await supabase
      .from('fine_tuning_jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Legal Documents
  static async getLegalDocuments(filters?: {
    document_type?: string
    jurisdiction?: string
    limit?: number
  }) {
    let query = supabase
      .from('legal_documents')
      .select('*')

    if (filters?.document_type) {
      query = query.eq('document_type', filters.document_type)
    }

    if (filters?.jurisdiction) {
      query = query.eq('jurisdiction', filters.jurisdiction)
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 50)

    const { data, error } = await query

    if (error) throw error
    return data
  }

  // Prompt Response Pairs (for training data)
  static async getPromptResponsePairs(filters?: {
    pair_type?: string
    verified?: boolean
    limit?: number
  }) {
    let query = supabase
      .from('prompt_response_pairs')
      .select('*')

    if (filters?.pair_type) {
      query = query.eq('pair_type', filters.pair_type)
    }

    if (filters?.verified !== undefined) {
      query = query.eq('verified', filters.verified)
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 100)

    const { data, error } = await query

    if (error) throw error
    return data
  }

  // User Profile Management
  static async updateUserProfile(updates: {
    full_name?: string
    avatar_url?: string
    preferences?: any
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase.auth.updateUser({
      data: updates
    })

    if (error) throw error
    return data
  }

  // Real-time subscriptions helper
  static subscribeToTable<T extends keyof Tables>(
    table: T,
    callback: (payload: any) => void,
    filter?: string
  ) {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter
        },
        callback
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }

  // Batch operations
  static async batchInsert<T extends keyof Tables>(
    table: T,
    records: Tables[T]['Insert'][]
  ) {
    const { data, error } = await supabase
      .from(table)
      .insert(records)
      .select()

    if (error) throw error
    return data
  }

  // Search functionality
  static async searchLegalDocuments(query: string, limit = 20) {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .textSearch('content', query)
      .limit(limit)

    if (error) throw error
    return data
  }

  // Analytics helpers
  static async getUserAnalytics() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    const [contractAnalyses, sessions, apiUsage] = await Promise.all([
      this.getContractAnalyses(100),
      this.getUserSessions(100),
      supabase
        .from('api_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ])

    return {
      contractAnalyses: contractAnalyses || [],
      sessions: sessions || [],
      apiUsage: apiUsage.data || [],
      totalContracts: contractAnalyses?.length || 0,
      totalSessions: sessions?.length || 0,
      totalApiCalls: apiUsage.data?.length || 0
    }
  }
}