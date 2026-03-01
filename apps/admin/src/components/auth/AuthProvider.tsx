import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const isDev = import.meta.env.DEV;

// Real admin user ID (longsangsabo@gmail.com) - use for dev mode too
const ADMIN_USER_ID = '89917901-cf15-45c4-a7ad-8c4c9513347e';

// Create mock user for dev mode - use real admin ID for Brain compatibility
const createDevUser = (): User => ({
  id: ADMIN_USER_ID, // Use real admin ID so Brain data is accessible
  aud: 'authenticated',
  role: 'authenticated',
  email: localStorage.getItem('dev-user-email') || 'longsangsabo@gmail.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'dev', providers: ['dev'] },
  user_metadata: { full_name: 'Dev Admin', role: 'admin' },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const createDevSession = (user: User): Session => ({
  access_token: 'dev-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'dev-refresh-token',
  user,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // DEV MODE: Always auto-bypass auth — no login screen needed
    // This gives immediate access to ALL routes including admin & manager
    if (isDev) {
      const devUser = createDevUser();
      const devSession = createDevSession(devUser);
      setSession(devSession);
      setUser(devUser);
      // Sync userId to localStorage for Brain API
      localStorage.setItem('userId', devUser.id);
      localStorage.setItem('dev-auth-bypass', 'true');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Sync userId to localStorage for Brain API
      if (session?.user?.id) {
        localStorage.setItem('userId', session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Sync userId to localStorage for Brain API
      if (session?.user?.id) {
        localStorage.setItem('userId', session.user.id);
      } else {
        localStorage.removeItem('userId');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (isDev && localStorage.getItem('dev-auth-bypass') === 'true') {
      localStorage.removeItem('dev-auth-bypass');
      localStorage.removeItem('dev-user-email');
      setSession(null);
      setUser(null);
    } else {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
