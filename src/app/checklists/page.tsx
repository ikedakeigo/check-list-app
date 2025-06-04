"use client";

import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import PlusIcon from "@/components/icons/PlusIcon";
import BackIcon from "@/components/icons/BackIcon";
import useAuthCheck from "../_hooks/useAuthCheck";
import Link from "next/link";
import { CheckListWithItems } from "../_types/checklists";

const ChecklistsPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checklists, setChecklists] = useState<CheckListWithItems[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState<string | undefined>("");
  const [error, setError] = useState<string | null>(null);

  // カスタムフックを使用してログインユーザー情報を取得
  const authUser = useAuthCheck();

  // ログインユーザー情報
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    }
  }, [authUser]);

  //チェックリストの検索条件取得
  useEffect(() => {
    if (user) {
      fetchChecklists();
    }
    // 検索窓にユーザー情報、フィルター、検索クエリが変更された場合に再取得
  }, [user, selectedFilter, searchQuery]);

  // チェックリスト取得
  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/checklists?filter=${filter&search=${searchQuery}");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "エラーが発生しました");

      setChecklists(data);
    } catch (error) {
      console.error("エラーが発生しました", error);
      setError("チェックリストの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // チェックリスト詳細ページへ
  const handleViewChecklist = (id: number) => {
    router.push(`/checklists/${id}`);
  };

  // フィルタータブ
  const filterTabs = [
    { id: "all", label: "すべて" },
    { id: "active", label: "進行中" },
    { id: "completed", label: "完了" },
    { id: "templates", label: "テンプレート" },
    { id: "archived", label: "アーカイブ" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Link href="/"><BackIcon /></Link>
            <h1 className="text-xl font-bold">チェックリスト一覧</h1>
          </div>
          <Link href="/checklists/new" className="bg-white bg-opacity-20 p-2 rounded-lg">
            <PlusIcon />
          </Link>
        </div>

        {/* 検索フォーム */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="検索..."
            className="w-full px-3 py-2 pl-10 bg-white bg-opacity-20 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </header>

      {/* フィルタータブ */}
      <div className="bg-white border-b">
        <div className="flex overflow-x-auto p-2 space-x-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm ${
                selectedFilter === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* チェックリスト一覧 */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-600 text-center">{error}</div>
        ) : checklists.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
            チェックリストがありません
          </div>
        ) : (
          <div className="space-y-3">
            {checklists.map((checklist) => (
              <div
                key={checklist.id}
                className="bg-white p-4 rounded-lg shadow-sm"
                onClick={() => handleViewChecklist(checklist.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-lg text-gray-900">{checklist.name}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      checklist.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : checklist.isTemplate
                        ? "bg-purple-100 text-purple-800"
                        : checklist.archivedAt
                        ? "bg-gray-100 text-gray-800"
                        : checklist.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {checklist.status === "Completed"
                      ? "完了"
                      : checklist.isTemplate
                      ? "テンプレート"
                      : checklist.archivedAt
                      ? "アーカイブ"
                      : checklist.status === "Pending"
                      ? "進行中" : "未着手"
                      }
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  {new Date(checklist.workDate).toLocaleDateString()} - {checklist.siteName}
                </div>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${
                          ((checklist.completedItems || 0) / (checklist.totalItems || 1)) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="ml-4 text-sm text-gray-600">
                    {checklist.completedItems || 0}/{checklist.totalItems || "?"}
                  </span>
                </div>
                {checklist.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{checklist.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistsPage;
