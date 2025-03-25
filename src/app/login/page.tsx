'use client';

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import useGoogleAuth from "../_hooks/useGoogleAuth";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { handleGoogleAuth } = useGoogleAuth();

  // メールアドレスとパスワードでログイン
  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {  error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // ログイン成功時の処理
      router.push("/");
    } catch (error) {
      const errorMessage = (error as Error).message || "ログインに失敗しました";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  // LINEでログイン
  const handleLineLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure", //todo LINEが使用できないので、後ここを変更または削除
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      const errorMessage = (error as Error).message || "LINEでログインに失敗しました";
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* ロゴ */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">GM</span>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">現場マネジ</h1>
          <p className="mt-2 text-sm text-gray-600">建設現場の備品管理をスマートに</p>
        </div>

        {/* エラーメッセージ */}
        {error && <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        {/* ログインフォーム */}
        <div className="mt-8 bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10">
          <div className="space-y-6">
            {/* snsログイン */}
            <div className="space-y-3">
              {/* Google */}
              <button onClick={handleGoogleAuth} disabled={loading} className="w-full flex items-center justify-center px-4 py-3 border border-y-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" fill="currentColor" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{loading ? "読み込み中..." : "Googleでログイン"}</span>
              </button>

              {/* LINE */}
              <button onClick={handleLineLogin} disabled className="w-full flex items-center justify-center px-4 py-3 bg-[#00B900] text-white rounded-lg shadow-sm hover:bg-[#00a000]">
                {/* LINEロゴ */}
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                <span className="text-sm font-medium">{loading ? "読み込み中..." : "LINEでログイン"}</span>
              </button>

            </div>

            {/* 区切り線 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            {/* メールアドレス */}
            <form className="space-y-6" onSubmit={handleEmailLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="example@gmail.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  パスワード
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="****"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ログイン
              </button>
            </form>

            {/* アカウント作成リンク */}
            <div className="text-center">
              <a href="/signup" className="text-sm text-blue-600 hover:underline">
                アカウントをお持ちでない方はこちら
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
