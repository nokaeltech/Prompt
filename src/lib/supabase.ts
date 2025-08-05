import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug environment variables
console.log('🔍 Environment variables check:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Not set');

// Create mock client for development when Supabase is not configured
const createMockClient = () => ({
  from: () => ({
    select: () => ({ 
      order: () => Promise.resolve({ data: [], error: null }),
      limit: () => Promise.resolve({ data: [], error: null })
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    or: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
    eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
  }),
  rpc: () => Promise.resolve({ data: null, error: null }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (callback: any) => ({
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
  },
});

// Initialize Supabase client
let supabase: any;

// Check if environment variables are properly configured
const isConfigured = supabaseUrl && supabaseAnonKey;

if (!isConfigured) {
  console.warn('⚠️  Supabase environment variables not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  console.warn('📖 See SUPABASE_SETUP.md for setup instructions');
  
  if (import.meta.env.DEV) {
    console.warn('🔄 Using mock Supabase client for development');
    supabase = createMockClient();
  } else {
    throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  }
} else {
  try {
    // Validate URL format
    if (!supabaseUrl.startsWith('https://')) {
      throw new Error('Supabase URL must start with https://');
    }
    
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    console.error('URL:', supabaseUrl);
    if (import.meta.env.DEV) {
      console.warn('🔄 Falling back to mock Supabase client');
      supabase = createMockClient();
    } else {
      throw error;
    }
  }
}

export { supabase }; 