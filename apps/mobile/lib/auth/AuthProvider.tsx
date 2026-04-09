import { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapSupabaseError(errorMessage: string): string {
  if (errorMessage.includes('Invalid login credentials')) {
    return 'メールアドレスまたはパスワードが正しくありません';
  }
  if (errorMessage.includes('Email not confirmed')) {
    return 'メールアドレスが確認されていません。確認メールをご確認ください';
  }
  if (errorMessage.includes('User already registered')) {
    return 'このメールアドレスは既に登録されています';
  }
  if (errorMessage.includes('Password should be at least')) {
    return 'パスワードは8文字以上で入力してください';
  }
  if (errorMessage.includes('rate limit')) {
    return 'リクエストが多すぎます。しばらく待ってからお試しください';
  }
  return 'エラーが発生しました。もう一度お試しください';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, session, loading } = useAuth();
  const [, setForceUpdate] = useState(0);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: mapSupabaseError(error.message) };
    }
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return { error: mapSupabaseError(error.message) };
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setForceUpdate((prev) => prev + 1);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      return { error: mapSupabaseError(error.message) };
    }
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signIn, signUp, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
