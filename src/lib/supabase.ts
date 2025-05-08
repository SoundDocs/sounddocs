import { createClient } from '@supabase/supabase-js';

// Default values for development
const DEFAULT_SUPABASE_URL = 'https://your-project-id.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'your-anon-key';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if we're using default credentials
export const isUsingDefaultCredentials = () => {
  return supabaseUrl === DEFAULT_SUPABASE_URL || supabaseAnonKey === DEFAULT_SUPABASE_ANON_KEY;
};

// Helper function to validate Supabase configuration
export const validateSupabaseConfig = () => {
  if (isUsingDefaultCredentials()) {
    console.warn(
      '⚠️ Using default Supabase credentials. Please set up your environment variables:\n' +
      '1. Create a .env file in the project root\n' +
      '2. Add the following variables:\n' +
      '   VITE_SUPABASE_URL=your_project_url\n' +
      '   VITE_SUPABASE_ANON_KEY=your_anon_key\n' +
      '3. Get these values from your Supabase project dashboard at https://app.supabase.com'
    );
    return false;
  }
  return true;
};