import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export const useSupabaseSession = () => {
  /**
   * undifind: ログイン状態ロード中
   * null: ログインしてない,
   * Session: ログインしている // supabaseでsession情報を管理
   */
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [token, setToken] = useState<string | null>(null);
  const [isLoding, setIsLoding] = useState(true);

  useEffect(() => {
    const fetcher = async () => {

      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setToken(session?.access_token || null);
      setIsLoding(false);
    };

    fetcher();
  }, []);

  return { session, token, isLoding };
};
