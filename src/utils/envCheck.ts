// Environment variable validation that runs before anything else
export const validateEnvironment = () => {
  console.log('🔍 Environment Check Starting...');
  
  // Check if we're in development or production
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;
  
  console.log('📍 Environment:', { isDev, isProd });
  
  // Get raw environment variables
  const rawEnv = import.meta.env;
  console.log('🔧 Raw environment variables:', {
    VITE_SUPABASE_URL: rawEnv.VITE_SUPABASE_URL ? 'present' : 'missing',
    VITE_SUPABASE_ANON_KEY: rawEnv.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing',
    VITE_GEMINI_API_KEY: rawEnv.VITE_GEMINI_API_KEY ? 'present' : 'missing',
    allKeys: Object.keys(rawEnv).filter(key => key.startsWith('VITE_'))
  });
  
  // Check for null/undefined values specifically
  const supabaseUrl = rawEnv.VITE_SUPABASE_URL;
  const supabaseKey = rawEnv.VITE_SUPABASE_ANON_KEY;
  
  console.log('🔍 Detailed variable check:', {
    supabaseUrl: {
      value: supabaseUrl,
      type: typeof supabaseUrl,
      isNull: supabaseUrl === null,
      isUndefined: supabaseUrl === undefined,
      isEmpty: supabaseUrl === '',
      length: supabaseUrl?.length || 0
    },
    supabaseKey: {
      value: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : supabaseKey,
      type: typeof supabaseKey,
      isNull: supabaseKey === null,
      isUndefined: supabaseKey === undefined,
      isEmpty: supabaseKey === '',
      length: supabaseKey?.length || 0
    }
  });
  
  // Return validation results
  return {
    isValid: !!(supabaseUrl && supabaseKey),
    supabaseUrl: supabaseUrl || null,
    supabaseKey: supabaseKey || null,
    issues: [
      ...((!supabaseUrl) ? ['Missing VITE_SUPABASE_URL'] : []),
      ...((!supabaseKey) ? ['Missing VITE_SUPABASE_ANON_KEY'] : [])
    ]
  };
};

// Run validation immediately when this module is imported
const envValidation = validateEnvironment();
export { envValidation };
