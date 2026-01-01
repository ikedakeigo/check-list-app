"use client";

import { useAuth } from "@/context/AuthContext";
import Header from "@/components/header/page";
import { useState } from "react";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError(null);

    try {
      await signOut();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "ログアウトに失敗しました";
      setError(errorMessage);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-16">
      <Header title="設定" showBack />

      <div className="flex-1 p-4 space-y-6">
        {/* ユーザー情報 */}
        {user && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-sm font-medium text-gray-500 mb-2">アカウント情報</h2>
            <p className="text-gray-900">{user.email}</p>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* ログアウトボタン */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full py-3 px-4 border border-red-300 rounded-lg text-red-600 font-medium hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? "ログアウト中..." : "ログアウト"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
