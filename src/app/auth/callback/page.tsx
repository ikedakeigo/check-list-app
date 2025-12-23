"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const AuthCallbackPage = () => {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;

        // Userテーブルにレコードが無ければ作成、あれば更新
        const ensureUser = async (supabaseUserId: string, name?: string) => {
          const generatedId = typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : supabaseUserId; // crypto未対応環境では supabaseUserId を利用
          const now = new Date().toISOString();

          const { data: userData, error } = await supabase
            .from("User")
            .upsert(
              {
                id: generatedId,
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

        // セッションが無い場合はログインへ
        if (!session?.user) {
          router.push("/login");
          return;
        }

        const user = session.user;
        await ensureUser(
          user.id,
          user.user_metadata?.name || user.user_metadata?.full_name || user.email || ""
        );
        router.push("/");
      } catch (error) {
        console.error("Auth callback error:", error);
        router.push("/login");
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
