export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      legal_documents: {
        Row: {
          id: string
          title: string
          content: string
          document_type: 'contract' | 'constitutional' | 'statute' | 'case_law' | 'regulation'
          jurisdiction: string
          source: string
          word_count: number
          complexity: 'low' | 'medium' | 'high'
          language: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          document_type: 'contract' | 'constitutional' | 'statute' | 'case_law' | 'regulation'
          jurisdiction?: string
          source: string
          word_count?: number
          complexity?: 'low' | 'medium' | 'high'
          language?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          document_type?: 'contract' | 'constitutional' | 'statute' | 'case_law' | 'regulation'
          jurisdiction?: string
          source?: string
          word_count?: number
          complexity?: 'low' | 'medium' | 'high'
          language?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      prompt_response_pairs: {
        Row: {
          id: string
          prompt: string
          response: string
          pair_type: 'summarization' | 'clause_explanation' | 'qa' | 'risk_analysis' | 'translation' | 'simplification'
          source_document_id: string | null
          quality_score: number
          verified: boolean
          tags: string[]
          metadata: Json
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          prompt: string
          response: string
          pair_type: 'summarization' | 'clause_explanation' | 'qa' | 'risk_analysis' | 'translation' | 'simplification'
          source_document_id?: string | null
          quality_score?: number
          verified?: boolean
          tags?: string[]
          metadata?: Json
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: string
          prompt?: string
          response?: string
          pair_type?: 'summarization' | 'clause_explanation' | 'qa' | 'risk_analysis' | 'translation' | 'simplification'
          source_document_id?: string | null
          quality_score?: number
          verified?: boolean
          tags?: string[]
          metadata?: Json
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
      }
      fine_tuning_jobs: {
        Row: {
          id: string
          name: string
          status: 'preparing' | 'training' | 'evaluating' | 'completed' | 'failed' | 'cancelled'
          model_name: string
          base_model: string
          config: Json
          progress: number
          metrics: Json
          logs: string[]
          model_id: string | null
          focus_areas: string[]
          created_at: string
          started_at: string | null
          completed_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          status?: 'preparing' | 'training' | 'evaluating' | 'completed' | 'failed' | 'cancelled'
          model_name: string
          base_model?: string
          config?: Json
          progress?: number
          metrics?: Json
          logs?: string[]
          model_id?: string | null
          focus_areas?: string[]
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          status?: 'preparing' | 'training' | 'evaluating' | 'completed' | 'failed' | 'cancelled'
          model_name?: string
          base_model?: string
          config?: Json
          progress?: number
          metrics?: Json
          logs?: string[]
          model_id?: string | null
          focus_areas?: string[]
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
          created_by?: string | null
        }
      }
      contract_analyses: {
        Row: {
          id: string
          document_name: string
          document_content: string
          overall_score: number
          risk_level: 'excellent' | 'good' | 'fair' | 'poor'
          clauses: Json
          summary: Json
          analysis_time: number
          created_at: string
          analyzed_by: string | null
        }
        Insert: {
          id?: string
          document_name: string
          document_content: string
          overall_score?: number
          risk_level?: 'excellent' | 'good' | 'fair' | 'poor'
          clauses?: Json
          summary?: Json
          analysis_time?: number
          created_at?: string
          analyzed_by?: string | null
        }
        Update: {
          id?: string
          document_name?: string
          document_content?: string
          overall_score?: number
          risk_level?: 'excellent' | 'good' | 'fair' | 'poor'
          clauses?: Json
          summary?: Json
          analysis_time?: number
          created_at?: string
          analyzed_by?: string | null
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string | null
          session_type: 'chatbot' | 'contract_validation' | 'document_analysis'
          messages: Json
          metadata: Json
          created_at: string
          updated_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_type: 'chatbot' | 'contract_validation' | 'document_analysis'
          messages?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          session_type?: 'chatbot' | 'contract_validation' | 'document_analysis'
          messages?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
          ended_at?: string | null
        }
      }
      api_usage: {
        Row: {
          id: string
          user_id: string | null
          endpoint: string
          method: string
          tokens_used: number
          cost_cents: number
          response_time_ms: number
          status_code: number
          error_message: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          endpoint: string
          method: string
          tokens_used?: number
          cost_cents?: number
          response_time_ms?: number
          status_code?: number
          error_message?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          endpoint?: string
          method?: string
          tokens_used?: number
          cost_cents?: number
          response_time_ms?: number
          status_code?: number
          error_message?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      model_deployments: {
        Row: {
          id: string
          job_id: string | null
          model_name: string
          endpoint_url: string | null
          status: 'deploying' | 'active' | 'inactive' | 'failed'
          performance_metrics: Json
          deployment_config: Json
          created_at: string
          deployed_at: string | null
          last_health_check: string | null
          deployed_by: string | null
        }
        Insert: {
          id?: string
          job_id?: string | null
          model_name: string
          endpoint_url?: string | null
          status?: 'deploying' | 'active' | 'inactive' | 'failed'
          performance_metrics?: Json
          deployment_config?: Json
          created_at?: string
          deployed_at?: string | null
          last_health_check?: string | null
          deployed_by?: string | null
        }
        Update: {
          id?: string
          job_id?: string | null
          model_name?: string
          endpoint_url?: string | null
          status?: 'deploying' | 'active' | 'inactive' | 'failed'
          performance_metrics?: Json
          deployment_config?: Json
          created_at?: string
          deployed_at?: string | null
          last_health_check?: string | null
          deployed_by?: string | null
        }
      }
      compliance_logs: {
        Row: {
          id: string
          document_id: string
          processing_type: 'anonymization' | 'analysis' | 'storage' | 'deletion'
          anonymization_applied: boolean
          sensitive_data_removed: string[]
          compliance_standards: string[]
          compliance_checks: Json
          retention_expiry: string | null
          created_at: string
          processed_by: string | null
        }
        Insert: {
          id?: string
          document_id: string
          processing_type: 'anonymization' | 'analysis' | 'storage' | 'deletion'
          anonymization_applied?: boolean
          sensitive_data_removed?: string[]
          compliance_standards?: string[]
          compliance_checks?: Json
          retention_expiry?: string | null
          created_at?: string
          processed_by?: string | null
        }
        Update: {
          id?: string
          document_id?: string
          processing_type?: 'anonymization' | 'analysis' | 'storage' | 'deletion'
          anonymization_applied?: boolean
          sensitive_data_removed?: string[]
          compliance_standards?: string[]
          compliance_checks?: Json
          retention_expiry?: string | null
          created_at?: string
          processed_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}