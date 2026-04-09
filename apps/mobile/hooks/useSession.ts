import { useAuth } from './useAuth';

export function useSession() {
  const { user, session, loading } = useAuth();

  return {
    token: session?.access_token ?? null,
    user,
    loading,
    isAuthenticated: !!user,
  };
}
