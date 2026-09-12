/**
 * Environment Variable Validation
 * Validates required environment variables at startup to prevent runtime errors
 */

export function validateEnv() {
  // Use direct references so Next.js can inline NEXT_PUBLIC_ vars in the client bundle
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missing = [
    !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
    !anonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null,
  ].filter((key): key is string => Boolean(key));
  
  if (missing.length > 0) {
    const errorMessage = [
      '❌ Missing required environment variables:',
      ...missing.map(key => `   - ${key}`),
      '',
      '📝 Please check your .env.local file.',
      '💡 See .env.example for reference.',
    ].join('\n');
    
    throw new Error(errorMessage);
  }

  // Validate URL format
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL should start with https://');
  }

  // Validate key format (basic check)
  if (anonKey && anonKey.length < 100) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY seems too short. Please verify.');
  }
}

/**
 * Get environment variable with fallback
 */
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value && !fallback) {
    throw new Error(`Environment variable ${key} is not set and no fallback provided`);
  }
  return value || fallback || '';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
