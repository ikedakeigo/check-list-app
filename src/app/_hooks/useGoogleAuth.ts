import { supabase } from '@/lib/supabase';
import { useState } from 'react'

const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if( error ) throw error;
    } catch (error) {
      setError(error.message || 'Googleでの登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return { handleGoogleAuth, loading, error };
}

export default useGoogleAuth
