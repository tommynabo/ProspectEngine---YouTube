
/**
 * STUB: Supabase compatibility layer
 * 
 * This file provides empty stubs to prevent import errors.
 * The actual authentication is handled via JWT in lib/auth.ts
 * and lib/client.ts
 * 
 * TODO: Refactor App.tsx and other components to use lib/client.ts
 * instead of these Supabase stubs.
 */

const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    signOut: async () => ({}),
    onAuthStateChange: () => () => {},
  },
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        order: () => ({
          asc: async () => ({ data: [], error: null }),
          desc: async () => ({ data: [], error: null }),
        }),
      }),
      order: () => ({
        asc: async () => ({ data: [], error: null }),
        desc: async () => ({ data: [], error: null }),
      }),
      async: () => ({ data: [], error: null }),
    }),
    insert: () => ({
      select: async () => ({ data: null, error: null }),
    }),
    update: () => ({
      eq: () => ({
        select: async () => ({ data: null, error: null }),
      }),
    }),
    delete: () => ({
      eq: async () => ({ error: null }),
    }),
  }),
};

export { supabase };

