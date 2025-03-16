"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const AuthCallbackPage = () => {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data } = await supabase.auth.getSession();

      // ログイン成功時はホーム画面に遷移
      if (data?.session) {
        router.push("/");
      } else {
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
