"use client";

import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import { GroupedItemsType } from "@/app/_types/checkListItems";
import { handleChecklistStatusUpdate } from "@/app/utils/handleChecklistStatusUpdate";
import { CheckListItem, CheckLists } from "@prisma/client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const ChecklistDetailPage = () => {
  const { id, checkListId } = useParams();
  const router = useRouter();
  const { token } = useSupabaseSession();

  const [checklist, setChecklist] = useState<CheckLists | null>(null);
  const [items, setItems] = useState<CheckListItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<GroupedItemsType>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // チェックリストとアイテムのデータを取得
  useEffect(() => {
    const fetchChecklist = async () => {
      if (!token) return;
      try {
        setLoading(true);

        // チェックリスト詳細を取得
        const checklistRes = await fetch(`/api/checklists/${id}`, {
          headers: {
            Authorization: token,
          },
        });

        if (!checklistRes.ok) throw new Error("チェックリストの取得に失敗しました");

        const checklistData = await checklistRes.json();
        setChecklist(checklistData);

        // チェックリストのアイテムを取得
        const itemsRes = await fetch(`/api/checklists/${id}/items`, {
          headers: {
            Authorization: token,
          },
        });

        if (!itemsRes.ok) throw new Error("チェックリストのアイテムの取得に失敗しました");

        const itemsData = await itemsRes.json();

        setItems(itemsData);

        // カテゴリごとにアイテムをグループ化
        /**
         * Record<キーの型, 値の型>
         * キーがカテゴリー名、値がアイテムの配列
         */
        const grouped: Record<string, CheckListItem[]> = {};
        itemsData.forEach((item: any) => {
          const categoryName = item.category.name;
          // カテゴリー名がキーに存在しない場合は新しく配列を作成
          if (!grouped[categoryName]) {
            grouped[categoryName] = [];
          }
          // カテゴリー名をキーにアイテムを追加
          grouped[categoryName].push(item);
        });

        setGroupedItems(grouped);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("チェックリストの取得に失敗しました");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchChecklist();
    }
  }, [id, token]);


  // アイテムのステータス更新ロジック
  const updateItemStatusInState = (updatedItem: CheckListItem) => {
    // 全体アイテム更新
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );

    // グループ化されたアイテムの更新
    setGroupedItems((prev) => {
      const newGroupedItems = { ...prev };
      Object.keys(newGroupedItems).forEach((categoryName) => {
        newGroupedItems[categoryName] = newGroupedItems[categoryName].map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        );
      });
      return newGroupedItems;
    });
  };


  // アイテムのステータスを更新
  const handleItemsStatusChange = async (itemId: number, newStatus: "Pending" | "Completed") => {
    try {
      if (!token) return;

      const res = await fetch(`/api/checklists/${id}/items/${itemId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("アイテムのステータスの更新に失敗しました");

      // アイテムのステータスを更新
      const updatedItem: CheckListItem = await res.json();

      // ローカル状態の更新
      updateItemStatusInState(updatedItem);

      const updatedItems = items.map((item) =>
        // 対象のアイテムだけ（クリックしたアイテム）ステータスを更新し、それ以外はそのまま返す
        item.id === itemId ? { ...item, status: newStatus } : item
      );

      await handleChecklistStatusUpdate(
        updatedItems,
        checklist,
        setChecklist,
        token,
        Number(id)
      )

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("アイテムのステータスの更新に失敗しました");
      }
    }
  };

  // チェックリストをアーカイブにする
  const handleArchiveChecklist = async () => {
    if (!confirm("チェックリストをアーカイブしますか？")) return;

    try {
      if (!token) return;

      const res = await fetch(`/api/checklists/${checkListId}/archive`, {
        method: "POST",
        headers: {
          Authorization: token,
        },
      });

      if (!res.ok) throw new Error("チェックリストのアーカイブに失敗しました");

      alert("チェックリストをアーカイブしました");
      router.push("/checklists");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("チェックリストのアーカイブに失敗しました");
      }
    }
  };

  // 全てのアイテムのステータスを更新
  const handleCompleteAllItems = async () => {

    if (!confirm("全てのアイテムを完了にしますか？")) return;

    try {
      if (!token) return;

      // 未完了のアイテムを取得
      const pendingItems = items.filter((item) => item.status === "Pending");

      const res = await fetch(`/api/checklists/${id}/items`, {
        method: "PATCH",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Completed",
          itemIds: pendingItems.map((item) => item.id),
        }),
      });

      if (!res.ok) throw new Error("全てのアイテムの完了に失敗しました");

      // アイテムのステータスを更新
      const updatedItems: CheckListItem[] = await res.json();

      // 各アイテムのステータスを更新
      updatedItems.forEach(updateItemStatusInState);

      await handleChecklistStatusUpdate(
        updatedItems,
        checklist,
        setChecklist,
        token,
        Number(id) // パラメータで取得したidを使用、数値型に変換
      )

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("全てのアイテムの完了に失敗しました");
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
          <button
            onClick={() => router.push("/checklists")}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            チェックリスト一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  if (!loading && !checklist) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
          <p>チェックリストが見つかりませんでした</p>
          <button
            onClick={() => router.push("/checklists")}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            チェックリスト一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  // 完了アイテム数と進捗率を計算
  const completedItems = items.filter((item) => item.status === "Completed").length;
  const totalItems = items.length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
          <button onClick={() => router.push("/checklists")} className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold">チェックリスト詳細</h1>
          <div className="flex space-x-2">
            <Link href={`/checklists/${id}/edit`} className="p-2 bg-white bg-opacity-20 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </Link>
            <button
              onClick={handleArchiveChecklist}
              className="p-2 bg-white bg-opacity-20 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <main className="p-4">
          {/* チェックリスト情報 */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-bold text-gray-900">{checklist?.name}</h2>
            {checklist?.description && (
              <p className="mt-2 text-gray-600">{checklist?.description}</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">日付: </span>
                {checklist?.workDate && (
                  <span>{new Date(checklist.workDate).toLocaleDateString()}</span>
                )}
              </div>
              <div>
                <span className="text-gray-500">現場名: </span>
                <span>{checklist?.siteName}</span>
              </div>
              <div>
                <span className="text-gray-500">ステータス: </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    checklist?.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {checklist?.status === "Completed" ? "完了" : "進行中"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">作成日: </span>
                {checklist?.createdAt && (
                  <span>{new Date(checklist.createdAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>

          {/* 進捗バー */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">進捗状況</span>
              <span className="text-sm font-medium text-gray-700">
                {completedItems}/{totalItems} アイテム
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-green-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* アイテム一覧 */}
          {Object.entries(groupedItems).map(([categoryName, categoryItems]) => (
            <div key={categoryName} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{categoryName}</h3>
              <div className="space-y-3">
                {categoryItems.map((item) => (
                  <div
                    key={`${item.name}-${item.id}`}
                    className="bg-white p-4 rounded-lg shadow-sm flex items-start"
                  >
                    <input
                      type="checkbox"
                      checked={item.status === "Completed"}
                      onChange={(e) =>
                        handleItemsStatusChange(item.id, e.target.checked ? "Completed" : "Pending")
                      }
                      className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1"
                    />

                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <h4
                          className={`font-medium ${
                            item.status === "Completed"
                              ? "line-through text-gray-500"
                              : "text-gray-900"
                          }`}
                        >
                          {item.name}
                          {item.id}
                        </h4>
                        {item.quantity && item.unit && (
                          <span className="text-sm text-gray-500">
                            {item.quantity} {item.unit}
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                      )}

                      {item.memo && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded-md text-sm text-gray-700">
                          <span className="font-medium">メモ: </span>
                          {item.memo}
                        </div>
                      )}

                      {item.completedAt && (
                        <div className="mt-2 text-xs text-gray-500">
                          完了日時: {new Date(item.completedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 全て完了ボタン */}
          {items.length > 0 && items.some((item) => item.status === "Pending") && (
            <div className="flex justify-center mb-6">
              <button
                onClick={handleCompleteAllItems}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                全てのアイテムを完了にする
              </button>
            </div>
          )}

          {totalItems === 0 && (
            <div className="bg-gray-50 p-8 text-center text-gray-500 rounded-lg border-2 border-dashed border-gray-300">
              <p>アイテムがありません</p>
              <Link
                href={`/checklists/${id}/edit`}
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                アイテムを追加する
              </Link>
            </div>
          )}
        </main>
      )}
      {/* フローティングアクションボタン */}
      <Link
        href={`/checklists/${id}/edit`}
        className="fixed bottom-15 right-6 bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </Link>
    </div>
  );
};

export default ChecklistDetailPage;
