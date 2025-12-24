"use client";

import { supabase } from "@/lib/supabase";
import React, { useEffect, useState, useCallback } from "react";
import { RecentCheckList, TodaysCheckList } from "./_types/checkListItems";
import { NotificationRequestBody } from "./_types/notification";
import Header from "@/components/header/page";
import ArchiveIcon from "@/components/icons/ArchiveIcon";
import PlusIcon from "@/components/icons/PlusIcon";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

const HomePage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [todayChecklists, setTodayChecklists] = useState<TodaysCheckList>([]);
  const [recentChecklists, setResentChecklists] = useState<RecentCheckList>([]);
  const [notifications, setNotifications] = useState<NotificationRequestBody[]>([]);
  const [completedTaskCount, setCompletedTaskCount] = useState(0);
  const [totalTaskCount, setTotalTaskCount] = useState(0);

  // 未認証時はログインページにリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // データ取得
  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // UserテーブルからユーザーのIDを取得
      const { data: userData } = await supabase
        .from("User")
        .select("id")
        .eq("supabaseUserId", user.id)
        .single();

      if (!userData?.id) {
        console.error("ユーザーが見つかりませんでした");
        return;
      }

      const actualUserId = userData.id;

      // 今日の日付範囲を設定
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 今日のチェックリストを取得
      const { data: todayData, error: todayError } = await supabase
        .from("CheckLists")
        .select("*")
        .eq("userId", actualUserId)
        .gte("workDate", today.toISOString())
        .lt("workDate", tomorrow.toISOString())
        .is("archivedAt", null)
        .limit(5);

      if (todayError) {
        console.error("Error fetching today checklists:", todayError);
        setTodayChecklists([]);
        return;
      }

      // 各チェックリストの項目数を計
      if (todayData && todayData.length > 0) {
        const checklistsWithStats = await Promise.all(
          todayData.map(async (checklist) => {
            // 各チェックリストの項目を取得
            const { data: items, error: itemsError } = await supabase
              .from("CheckListItem")
              .select("status")
              .eq("checkListId", checklist.id);

            if (itemsError) {
              console.error("Error fetching items for checklist:", checklist.id, itemsError);
              return {
                ...checklist,
                totalItems: 0,
                completedItems: 0,
              };
            }

            const totalItems = items?.length || 0;
            const completedItems = items?.filter((item) => item.status === "Completed").length || 0;

            return {
              ...checklist,
              totalItems,
              completedItems,
            };
          })
        );

        setTodayChecklists(checklistsWithStats);

        // 全体の統計を計算
        let totalCompleted = 0;
        let totalAll = 0;
        checklistsWithStats.forEach((item) => {
          totalCompleted += item.completedItems;
          totalAll += item.totalItems;
        });

        setCompletedTaskCount(totalCompleted);
        setTotalTaskCount(totalAll);
      } else {
        setTodayChecklists([]);
        setCompletedTaskCount(0);
        setTotalTaskCount(0);
      }

      // 最近のチェックリストを取得
      const { data: recentData, error: recentError } = await supabase
        .from("CheckLists")
        .select("*")
        .eq("userId", actualUserId)
        .is("archivedAt", null)
        .order("createdAt", { ascending: false })
        .limit(5);

      if (!recentError && recentData) {
        // 最近のチェックリストにも項目数を追加
        const recentWithStats = await Promise.all(
          recentData.map(async (checklist) => {
            const { data: items } = await supabase
              .from("CheckListItem")
              .select("status")
              .eq("checkListId", checklist.id);

            const totalItems = items?.length || 0;
            const completedItems = items?.filter((item) => item.status === "Completed").length || 0;

            return {
              ...checklist,
              totalItems,
              completedItems,
            };
          })
        );

        setResentChecklists(recentWithStats);
      }

      // 通知を取得
      const { data: notifData, error: notificationError } = await supabase
        .from("Notification")
        .select("*")
        .eq("userId", actualUserId)
        .order("createdAt", { ascending: false })
        .limit(3);

      if (!notificationError) {
        setNotifications(notifData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 認証が完了し、ユーザーが存在する場合にデータを取得
  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, fetchData]);

  const stats = [
    { label: "本日の現場", value: todayChecklists.length },
    {
      label: "完了タスク",
      value: `${completedTaskCount}/${totalTaskCount || "?"}`,
    },
    {
      label: "未完了",
      value: totalTaskCount - completedTaskCount >= 0 ? totalTaskCount - completedTaskCount : "?",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <Header
        title="現場マネジ"
        showNotification
        notificationCount={notifications.length}
        userName={user?.user_metadata?.name || user?.email}
      />

      {/* メインコンテンツ */}
      <main className="p-4 pb-24 flex-1 overflow-y-auto">
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
              <h2 className="text-lg font-bold mb-4 text-black">今日の現場</h2>
              <div className="space-y-3">
                {todayChecklists.length > 0 ? (
                  todayChecklists.map((checklist) => (
                    <Link
                      href={`/checklists/${checklist.id}`}
                      key={checklist.id}
                      className="block bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 mb-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-blue-600">{checklist.name}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(checklist.workDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{checklist.siteName}</p>
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${
                                checklist.totalItems > 0
                                  ? (checklist.completedItems / checklist.totalItems) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="ml-4 text-sm text-gray-600">
                          {checklist.completedItems}/{checklist.totalItems}
                        </span>
                      </div>
                    </Link>
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
              <h2 className="text-lg font-bold mb-4 text-black">最近のチェックリスト</h2>
              <div className="space-y-3">
                {recentChecklists.length > 0 ? (
                  recentChecklists.map((checklist) => (
                    <Link
                      href={`/checklists/${checklist.id}`}
                      key={checklist.id}
                      className="block bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 mb-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-blue-600">{checklist.name}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(checklist.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {checklist.siteName || "現場名なし"}
                      </p>
                      {/* プログレスバーの代わりに */}
                      <div className="flex justify-between text-sm">
                        {/* <span className="text-blue-600">詳細を見る</span> */}
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            checklist.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : checklist.isTemplate
                              ? "bg-purple-100 text-purple-800"
                              : checklist.archivedAt
                              ? "bg-gray-100 text-gray-800"
                              : checklist.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {checklist.status === "Completed"
                            ? "完了"
                            : checklist.isTemplate
                            ? "テンプレート"
                            : checklist.archivedAt
                            ? "アーカイブ"
                            : checklist.status === "Pending"
                            ? "進行中"
                            : "未着手"}
                        </span>
                      </div>
                    </Link>
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
              <h2 className="text-lg font-bold mb-4 text-black">クイックアクション</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/checklists/new"
                  className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center space-x-2 text-blue-600"
                >
                  <PlusIcon />
                  <span>新規チェックリスト</span>
                </Link>
                <Link
                  href="/archive"
                  className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center space-x-2 text-blue-600"
                >
                  <ArchiveIcon />
                  <span>アーカイブ一覧</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
