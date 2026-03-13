'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { ToastProvider, Toaster } from '@/components/ui/toast';
import type { Profile } from '@/types';

// Browser singleton for QueryClient
let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new client
    return new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60 * 1000, retry: 1 },
      },
    });
  }
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60 * 1000, retry: 1 },
      },
    });
  }
  return browserQueryClient;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading, logout } = useAuthStore();

  React.useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({ id: session.user.id, email: session.user.email ?? '', profile: profile as Profile | null });
        setProfile(profile as Profile | null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({ id: session.user.id, email: session.user.email ?? '', profile: profile as Profile | null });
        setProfile(profile as Profile | null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '', profile: null });
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        logout();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile, setLoading, logout]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // Use useState to prevent SSR leaks (not module-level)
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </ToastProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
