"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const AuthCallbackPage = () => {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      let session = null;
      try {
        const { data } = await supabase.auth.getSession();
        session = data?.session;

        if (!session?.user) {
          router.push("/login");
          return;
        }

        // Userテーブルにレコードが無ければ作成、あれば更新
        const ensureUser = async (supabaseUserId: string, name?: string) => {
          // 既存ユーザーを確認
          const { data: existingUser } = await supabase
            .from("User")
            .select("id")
            .eq("supabaseUserId", supabaseUserId)
            .single();

          const userId = existingUser?.id || crypto.randomUUID();
          const now = new Date().toISOString();

          const { data: userData, error } = await supabase
            .from("User")
            .upsert(
              {
                id: userId,
                supabaseUserId,
                name: name ?? "",
                role: "user",
                createdAt: now,
                updatedAt: now,
              },
              { onConflict: "supabaseUserId" }
            )
            .select("id")
            .single();

          if (error) throw error;
          return userData.id;
        };

        const user = session.user;
        await ensureUser(
          user.id,
          user.user_metadata?.name || user.user_metadata?.full_name || user.email || ""
        );

        router.push("/");
      } catch (error) {
        console.error("Auth callback error:", error);
        // セッションが有効な場合はホームへ（既存ユーザーの可能性）
        if (session?.user) {
          router.push("/");
        } else {
          router.push("/login");
        }
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">認証中...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
