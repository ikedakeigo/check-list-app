"use client";

import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PlusIcon from "@/components/icons/PlusIcon";
import BackIcon from "@/components/icons/BackIcon";
import { CheckLists } from "@prisma/client";

const ChecklistsPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checklists, setChecklists] = useState<CheckLists[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState<string | undefined>("");
  const [error, setError] = useState<string | null>(null);

  // ログインユーザー情報
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      fetchChecklists(user.id, selectedFilter);
    };

    checkUser();
  }, [router, selectedFilter]);

  // チェックリスト取得
  const fetchChecklists = async (userId: string, filter: string) => {
    console.log("fetchChecklists", userId, filter);
    setLoading(true);
    setError(null);

    try {
      // クリエ作成
      // SupabaseではPrismaで "items" とリレーションしているが、
      // Supabaseのスキーマキャッシュではリレーションが認識されないため、
      // 明示的に "CheckListItem" を指定してデータを取得する
      let query = supabase.from("CheckLists").select("*,CheckListItem(count)").eq("userId", userId);

      console.log("query", query);
      // フィルター適用
      if (filter === "active") {
        query = query.is("archivedAt", null).eq("isTemplate", false);
      } else if (filter === "completed") {
        query = query.is("archivedAt", null).eq("status", "Completed");
      } else if (filter === "templates") {
        query = query.eq("isTemplate", true);
      } else if (filter === "archived") {
        query = query.not("archivedAt", "is", null);
      }

      // 検索クエリ適用
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%, siteName.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order("createdAt", { ascending: false });

      if (error) {
        throw error;
      }

      setChecklists(data || []);
    } catch (error) {
      console.error("Error fetching checklists:", error);
      setError("チェックリストの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 新規チェックリスト作成ページへ
  const handleCreateNew = () => {
    router.push("/checklists/new");
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
            <button onClick={() => router.push("/")}>
              <BackIcon />
            </button>
            <h1 className="text-xl font-bold">チェックリスト一覧</h1>
          </div>
          <button onClick={handleCreateNew} className="bg-white bg-opacity-20 p-2 rounded-lg">
            <PlusIcon />
          </button>
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
    </div>
  );
};

export default ChecklistsPage;
