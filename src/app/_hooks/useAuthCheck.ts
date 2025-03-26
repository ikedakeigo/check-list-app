import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

const useAuthCheck = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
          console.error("認証エラー:", error?.message || "ユーザーが未ログイン");
          router.replace("/login"); // `replace` にすることでブラウザ履歴を変更
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error("ユーザー情報の取得に失敗しました:", err);
        router.replace("/login");
      }
    };

    checkUser();
  }, [router]);


  return user;
};

export default useAuthCheck;
