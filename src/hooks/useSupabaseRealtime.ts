import { useEffect, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Tables = keyof Database['public']['Tables']
type Row<T extends Tables> = Database['public']['Tables'][T]['Row']

interface UseRealtimeOptions<T extends Tables> {
  table: T
  filter?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
}

export function useSupabaseRealtime<T extends Tables>({
  table,
  filter,
  event = '*'
}: UseRealtimeOptions<T>) {
  const [data, setData] = useState<Row<T>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let channel: RealtimeChannel

    const setupRealtime = async () => {
      try {
        // Initial data fetch
        let query = supabase.from(table).select('*')
        
        if (filter) {
          // Parse simple filters like "status=eq.active"
          const [column, operator, value] = filter.split(/[=.]/)
          if (operator === 'eq') {
            query = query.eq(column, value)
          }
        }

        const { data: initialData, error: fetchError } = await query

        if (fetchError) {
          setError(fetchError.message)
        } else {
          setData(initialData || [])
        }

        // Set up realtime subscription
        channel = supabase
          .channel(`realtime:${table}`)
          .on(
            'postgres_changes',
            {
              event,
              schema: 'public',
              table,
              filter
            },
            (payload) => {
              console.log('Realtime update:', payload)
              
              if (payload.eventType === 'INSERT') {
                setData(current => [...current, payload.new as Row<T>])
              } else if (payload.eventType === 'UPDATE') {
                setData(current =>
                  current.map(item =>
                    (item as any).id === (payload.new as any).id
                      ? (payload.new as Row<T>)
                      : item
                  )
                )
              } else if (payload.eventType === 'DELETE') {
                setData(current =>
                  current.filter(item => (item as any).id !== (payload.old as any).id)
                )
              }
            }
          )
          .subscribe((status) => {
            console.log('Realtime subscription status:', status)
            if (status === 'SUBSCRIBED') {
              setLoading(false)
            }
          })

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    setupRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [table, filter, event])

  return { data, loading, error }
}

// Specific hooks for common use cases
export const useFineTuningJobs = () => {
  return useSupabaseRealtime({
    table: 'fine_tuning_jobs',
    event: '*'
  })
}

export const useContractAnalyses = (userId?: string) => {
  return useSupabaseRealtime({
    table: 'contract_analyses',
    filter: userId ? `analyzed_by=eq.${userId}` : undefined,
    event: '*'
  })
}

export const useUserSessions = (userId?: string) => {
  return useSupabaseRealtime({
    table: 'user_sessions',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    event: '*'
  })
}