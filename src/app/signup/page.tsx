"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import useGoogleAuth from "../_hooks/useGoogleAuth";

const SignupPage = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { handleGoogleAuth } = useGoogleAuth();

  // メールアドレスとパスワードで新規登録
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // パスワード確認
    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      setLoading(false);
      return;
    }

    try {
      // Supabaseで新規ユーザー登録
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      // ユーザー登録後、DBにも登録
      if (data?.user) {
        // ログイン成功のメッセージを表示し、ホームページにリダイレクト
        alert("アカウントが作成されました。メールを確認してください。");
        router.push("/login");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("アカウント作成に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  // Googleで登録
  // const handleGoogleSignup = async () => {
  //   setLoading(true);
  //   setError(null);

  //   try {
  //     const { data, error } = await supabase.auth.signInWithOAuth({
  //       provider: "google",
  //       options: {
  //         redirectTo: `${window.location.origin}/auth/callback`,
  //       },
  //     });

  //     if (error) throw error;
  //   } catch (error: any) {
  //     setError(error.message || "Googleでの登録に失敗しました");
  //     setLoading(false);
  //   }
  // };

  // Appleで登録
  const handleAppleSignup = async () => {
    // setLoading(true);
    // setError(null);
    // try {
    //   const { data, error } = await supabase.auth.signInWithOAuth({
    //     provider: "apple",
    //     options: {
    //       redirectTo: `${window.location.origin}/auth/callback`,
    //     },
    //   });
    //   if (error) throw error;
    // } catch (error: any) {
    //   setError(error.message || "Appleでの登録に失敗しました");
    //   setLoading(false);
    // }
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
          <p className="mt-2 text-sm text-gray-600">アカウント作成</p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* 登録フォーム */}
        <div className="mt-8 bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10">
          <div className="space-y-6">
            {/* SNS登録 */}
            <div className="space-y-3">
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {loading ? "読み込み中..." : "Googleで登録"}
                </span>
              </button>

              {/* Appleログインボタン */}
              <button
                onClick={handleAppleSignup}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 bg-black text-white rounded-lg shadow-sm hover:bg-gray-900 disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.913 1.183-4.962 3.007-2.12 3.675-.543 9.125 1.522 12.11 1.01 1.46 2.212 3.1 3.792 3.039 1.52-.065 2.096-.987 3.925-.987 1.83 0 2.35.987 3.944.948 1.638-.026 2.67-1.483 3.673-2.948 1.159-1.692 1.636-3.325 1.663-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.595-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.582 1.09z" />
                  <path d="M15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.708-.688 3.56-1.701" />
                </svg>
                <span className="text-sm font-medium">
                  {loading ? "読み込み中..." : "Appleで登録"}
                </span>
              </button>
            </div>

            {/* 区切り線 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">またはメールアドレスで登録</span>
              </div>
            </div>

            {/* メールアドレスでの登録 */}
            <form className="space-y-4" onSubmit={handleSignup}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  名前
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="山田 太郎"
                />
              </div>

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
                  placeholder="8文字以上"
                  minLength={8}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  パスワード（確認）
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="パスワードを再入力"
                  minLength={8}
                />
              </div>

              <div className="text-xs text-gray-500">
                <p>登録することで、利用規約とプライバシーポリシーに同意したことになります。</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "登録中..." : "アカウント作成"}
              </button>
            </form>

            {/* ログインリンク */}
            <div className="text-center">
              <Link href="/login" className="text-sm text-blue-600 hover:underline">
                すでにアカウントをお持ちの方はこちら
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
