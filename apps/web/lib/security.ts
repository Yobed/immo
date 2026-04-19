import { createClient } from '@/lib/supabase/server'

// Simple rate limiting logic using Supabase to store "events"
// This is more robust than in-memory for serverless environments
export async function checkRateLimit(userId: string, action: string, limit: number = 5, windowMinutes: number = 10) {
  const supabase = await createClient()
  
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()
  
  // Count actions in the last window
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (supabase as any)
    .from('security_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gt('created_at', windowStart)

  if (error) {
    console.error('Rate limit check error:', error)
    return true // Let it pass if DB is down, better UX than blocking wrongly
  }

  if (count && count >= limit) {
    return false
  }

  // Log the current action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('security_logs').insert({
    user_id: userId,
    action: action,
    metadata: { window: `${windowMinutes}m` }
  })

  return true
}
