import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas
export type QuizResponse = {
  id?: string
  created_at?: string
  age_range: string
  relationship_status: string
  problem_duration: string
  frequency: string
  anxiety_level: number
  tried_solutions: string[]
  main_concern: string
  email?: string
}

export type TrainingSession = {
  id?: string
  created_at?: string
  user_email?: string
  duration: number
  exercise_type: string
  notes?: string
}

export type UserProgress = {
  id?: string
  created_at?: string
  user_email?: string
  session_date: string
  duration: number
  success_rating: number
  notes?: string
}
