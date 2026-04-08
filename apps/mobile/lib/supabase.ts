import 'react-native-url-polyfill/auto'        // PREMIER import — polyfill URL API pour Hermes
import 'expo-sqlite/localStorage/install'       // DEUXIÈME — installe localStorage comme polyfill AsyncStorage
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@immo-ci/shared'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY manquantes dans apps/mobile/.env'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,       // expo-sqlite/localStorage installé ci-dessus
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,   // OBLIGATOIRE en React Native — pas de browser URL
  },
})
