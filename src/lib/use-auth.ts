'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '../../utils/supabase/client';
import { identify, reset as resetAnalytics } from './analytics';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      setLoading(false);
      if (data.user) {
        identify(data.user.id, { email: data.user.email });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' && session?.user) {
        identify(session.user.id, { email: session.user.email });
      }
      if (event === 'SIGNED_OUT') {
        resetAnalytics();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
