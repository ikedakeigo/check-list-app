'use client';

// アプリケーション全体で認証情報を共有するためのコンテキスト
// このコンテキストを使用することで、認証情報を簡単に取得できる

import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react'

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  getToken: async () => null,
});

export const useAuth = () => useContext(AuthContext)


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 初期ロード時にsessionを取得
    const getIntialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          // refresh_tokenエラーなどの場合、セッションをクリア
          console.error('Error fetching session', error.message);
          await supabase.auth.signOut();
          setUser(null);
          return;
        }

        setUser(session?.user ?? null);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error fetching session', error.message);
        }
        // エラー時はセッションをクリア
        await supabase.auth.signOut();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getIntialSession();

    // 認証状態変更時のリスナーを登録
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // サインアウトイベントまたはトークンリフレッシュ失敗時の処理
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null);
        } else if (event === 'SIGNED_IN') {
          setUser(session?.user ?? null);
        } else {
          setUser(session?.user ?? null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    }
  }, []);


  // サインアウト
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error signing out', error.message);
      }
    }
  };

  // トークン取得
  const getToken = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}
