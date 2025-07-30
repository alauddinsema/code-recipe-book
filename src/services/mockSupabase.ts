// Mock Supabase client for when the real one fails
export const createMockSupabaseClient = () => {
  const mockUser = null;
  
  return {
    auth: {
      signUp: async () => ({ data: null, error: new Error('Authentication service unavailable') }),
      signInWithPassword: async () => ({ data: null, error: new Error('Authentication service unavailable') }),
      signOut: async () => ({ data: null, error: null }),
      getUser: async () => ({ data: { user: mockUser }, error: null }),
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        // Call callback immediately with null session
        setTimeout(() => callback('SIGNED_OUT', null), 0);
        return {
          data: {
            subscription: {
              unsubscribe: () => {}
            }
          }
        };
      }
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: new Error('Database service unavailable') })
        }),
        order: () => ({
          limit: async () => ({ data: [], error: null })
        }),
        limit: async () => ({ data: [], error: null })
      }),
      insert: async () => ({ data: null, error: new Error('Database service unavailable') }),
      update: () => ({
        eq: async () => ({ data: null, error: new Error('Database service unavailable') })
      }),
      delete: () => ({
        eq: async () => ({ data: null, error: new Error('Database service unavailable') })
      })
    })
  };
};
