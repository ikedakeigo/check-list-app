"use client";

import ArchiveIcon from "@/components/icons/ArchiveIcon";
import BellIcon from "@/components/icons/BellIcon";
import ChecklistIcon from "@/components/icons/ChecklistIcon";
import HomeIcon from "@/components/icons/HomeIcon";
import PlusIcon from "@/components/icons/PlusIcon";
import SettingsIcon from "@/components/icons/SettingsIcon";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { CheckListItemsRequestBody } from "./_types/checkListItems";
import { NotificationRequestBody } from "./_types/notification";



const HonePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [todayChecklists, setTodayChecklists] = useState<CheckListItemsRequestBody[]>([]);
  const [recentChecklists, setResentChecklists] = useState<CheckListItemsRequestBody[]>([]);
  const [notifications, setNotifications] = useState<NotificationRequestBody[]>([]);

  // ログインユーザー情報を取得
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
      fetchData(user.id);
    };

    checkUser();
  }, [router]);

  // データ取得
  const fetchData = async (userId: string) => {
    setLoading(true);
    try {
      // 今日のチェックリストを取得
      const tody = new Date();
      tody.setHours(0, 0, 0, 0);
      const tomorrow = new Date(tody);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayData, error: todayError } = await supabase
      .from("checklist")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", tody.toISOString())
      .lt("created_at", tomorrow.toISOString())
      .is("archivedAt", null).limit(5);

      // エラーがあればコンソールに出力
      if(todayError) {
        console.error("Error fetching today checklists:", todayError);
      } else {
        // 今日のチェックリストをセット
        setTodayChecklists(todayData || []);
      }

      // 最近のチェックリストを取得
      const { data: recentData, error: recentError } = await supabase
      .from("checklist")
      .select("*")
      .eq("user_id", userId)
      .is("archivedAt", null)
      .order("created_at", { ascending: false })
      .limit(5);

      if (recentError) {
        console.error("Error fetching recent checklists:", recentError);
      }else {
        // 最近のチェックリストをセット
        setResentChecklists(recentData || []);
      }

      // 通知を取得
      const { data: notifData, error: notificationError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);

      if (notificationError) {
        console.error("Error fetching notifications:", notificationError);
      } else {
        setNotifications(notifData || []);
      }

      if (todayData) setTodayChecklists(todayData);
      if (recentData) setResentChecklists(recentData);
      if (notifData) setNotifications(notifData);
    } catch (error) {
      console.error("Error fetching data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSinOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ダミーデータ
  const stats = [
    { label: "本日の現場", value: todayChecklists.length || 0 },
    { label: "完了タスク", value: "5/12" },
    { label: "未完了", value: "7" },
  ];

  // サンプルデータ
  const dummyChecklists = [
    { id: 1, title: "サンプルチェックリスト", date: "2021-09-01", completed: 8, total: 10 },
    { id: 2, name: "△△改修工事", date: "2024-01-18", completed: 5, total: 5 },
    { id: 3, name: "××ビル設備工事", date: "2024-01-17", completed: 12, total: 15 },
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">現場マネジ</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <BellIcon />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 text-xs flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </div>
          {user && (
            <div className="text-sm">
              {user.user_metadata?.name || user.email}
            </div>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="p-4 pb-24">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 統計カード */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* 今日の現場 */}
            <div>
              <h2 className="text-lg font-bold mb-4">今日の現場</h2>
              <div className="space-y-3">
                {todayChecklists.length > 0 ? (
                  todayChecklists.map((checklist: any) => (
                    <div key={checklist.id} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{checklist.name}</h3>
                        <span className="text-sm text-gray-500">{new Date(checklist.workDate).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{checklist.siteName}</p>
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(checklist.completedItems || 0) / (checklist.totalItems || 1) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-4 text-sm text-gray-600">
                          {checklist.completedItems || 0}/{checklist.totalItems || '?'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-4 rounded-lg shadow-sm text-center text-gray-500">
                    今日の現場はありません
                  </div>
                )}
              </div>
            </div>

            {/* 最近のチェックリスト */}
            <div>
              <h2 className="text-lg font-bold mb-4">最近のチェックリスト</h2>
              <div className="space-y-3">
                {recentChecklists.length > 0 ? (
                  recentChecklists.map((checklist: any) => (
                    <div key={checklist.id} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{checklist.name}</h3>
                        <span className="text-sm text-gray-500">{new Date(checklist.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{checklist.siteName || '現場名なし'}</p>
                      {/* プログレスバーの代わりに */}
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-600">詳細を見る</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          checklist.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {checklist.status === 'Completed' ? '完了' : '進行中'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-4 rounded-lg shadow-sm text-center text-gray-500">
                    チェックリストはまだありません
                  </div>
                )}
              </div>
            </div>

            {/* クイックアクション */}
            <div>
              <h2 className="text-lg font-bold mb-4">クイックアクション</h2>
              <div className="grid grid-cols-2 gap-4">
                <button className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center space-x-2 text-blue-600">
                  <PlusIcon />
                  <span>新規チェックリスト</span>
                </button>
                <button className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center space-x-2 text-blue-600">
                  <ArchiveIcon />
                  <span>アーカイブ一覧</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* フッターナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around">
          <button className="flex flex-col items-center py-2 px-4 text-blue-600">
            <HomeIcon />
            <span className="text-xs mt-1">ホーム</span>
          </button>
          <button className="flex flex-col items-center py-2 px-4 text-gray-600">
            <ChecklistIcon />
            <span className="text-xs mt-1">チェック</span>
          </button>
          <button className="flex flex-col items-center py-2 px-4 text-gray-600">
            <ArchiveIcon />
            <span className="text-xs mt-1">アーカイブ</span>
          </button>
          <button className="flex flex-col items-center py-2 px-4 text-gray-600">
            <SettingsIcon />
            <span className="text-xs mt-1">設定</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default HonePage;
