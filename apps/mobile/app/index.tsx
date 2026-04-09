import { Redirect } from 'expo-router';
import { useAuthContext } from '@/lib/auth/AuthProvider';

export default function IndexRedirect() {
  const { user, loading } = useAuthContext();

  if (loading) return null;

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
