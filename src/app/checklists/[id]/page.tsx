"use client";

import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
// import { GroupedItemsType } from "@/app/_types/checkListItems";
import { handleChecklistStatusUpdate } from "@/app/utils/handleChecklistStatusUpdate";
import { CheckListItem, CheckLists, Prisma } from "@prisma/client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const ChecklistDetailPage = () => {
  const { id, checkListId } = useParams();
  const router = useRouter();
  const { token } = useSupabaseSession();
  type Grouped = Record<string, CheckListItem[]>;
  const [checklist, setChecklist] = useState<CheckLists | null>(null);
  const [items, setItems] = useState<CheckListItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<Grouped>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // リクエスト中のアイテムIDを管理（複数アイテムを同時に処理可能）
  const [updatingItemIds, setUpdatingItemIds] = useState<Set<number>>(new Set());

  // チェックリストとアイテムのデータを取得
  useEffect(() => {
    const fetchChecklist = async () => {
      if (!token) return;
      try {
        setLoading(true);

        const [checklistRes, itemsRes] = await Promise.all([
          // チェックリストの詳細を取得
          fetch(`/api/checklists/${id}`, {
            headers: {
              Authorization: token,
            },
          }),

          // チェックリストのアイテムを取得
          fetch(`/api/checklists/${id}/items`, {
            headers: {
              Authorization: token,
            },
          }),
        ]);

        if (!checklistRes.ok) throw new Error("チェックリストの取得に失敗しました");
        if (!itemsRes.ok) throw new Error("チェックリストのアイテムの取得に失敗しました");

        const [checklistData, itemsData] = await Promise.all([
          checklistRes.json(),
          itemsRes.json(),
        ]);

        setChecklist(checklistData);
        setItems(itemsData);

        // カテゴリごとにアイテムをグループ化
        /**
         * Record<キーの型, 値の型>
         * キーがカテゴリー名、値がアイテムの配列
         */

        // Prismaが返す「categoryを含む」アイテムの型
        type CheckListItemWithCategory = Prisma.CheckListItemGetPayload<{
          include: { category: true };
        }>;

        const grouped: Record<string, CheckListItem[]> = {};
        itemsData.forEach((item: CheckListItemWithCategory) => {
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

  // チェックリストを削除する
  const handleDeleteChecklist = async () => {
    if (!confirm("このチェックリストを削除しますか？この操作は元に戻せません。")) return;

    try {
      if (!token) return;

      const res = await fetch(`/api/checklists/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      });

      if (!res.ok) throw new Error("チェックリストの削除に失敗しました");

      alert("チェックリストを削除しました");
      router.push("/checklists");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("チェックリストの削除に失敗しました");
      }
    }
  };

  // アイテムのステータス更新ロジック
  const updateItemStatusInState = (updatedItem: CheckListItem) => {
    // 全体アイテム更新
    setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));

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
  const handleItemsStatusChange = async (itemId: number, newStatus: "NotStarted" | "Completed") => {
    // 既に更新中のアイテムは処理しない
    if (updatingItemIds.has(itemId)) return;

    try {
      if (!token) return;

      // 更新中のアイテムとしてマーク
      setUpdatingItemIds((prev) => new Set(prev).add(itemId));

      const res = await fetch(`/api/checklists/${id}/items/${itemId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("アイテムのステータスの更新に失敗しました");

      // 修正：APIレスポンス構造に合わせる
      const responseData = await res.json();
      const updatedItem: CheckListItem = responseData.item;

      // ✅ items全体を更新
      const updatedItems = items.map((item) => (item.id === itemId ? updatedItem : item));

      setItems(updatedItems); // ← ✅ 明示的に更新！
      updateItemStatusInState(updatedItem); // グループ化されたstateも更新

      // チェックリスト情報も更新
      if (responseData.checklist) {
        setChecklist(responseData.checklist);
      }

      await handleChecklistStatusUpdate(updatedItems, checklist, setChecklist, token, Number(id));
    } catch (error) {
      setError(error instanceof Error ? error.message : "アイテムのステータスの更新に失敗しました");
    } finally {
      // 更新完了したらマークを解除
      setUpdatingItemIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // チェックボックスのonChange イベントハンドラーも修正
  const handleCheckboxChange = (itemId: number, isChecked: boolean) => {
    // チェックされた場合は"Completed"、チェックが外された場合は"NotStarted"
    const newStatus = isChecked ? "Completed" : "NotStarted";

    handleItemsStatusChange(itemId, newStatus);
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
      const pendingItems = items.filter((item) => item.status === "NotStarted");

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
      );
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

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "Completed":
        return {
          style: "bg-green-100 text-green-800",
          label: "完了",
        };
      case "Pending":
        return {
          style: "bg-blue-100 text-blue-800",
          label: "進行中",
        };
      case "NotStarted":
        return {
          style: "bg-yellow-100 text-yellow-800",
          label: "未着手",
        };
      default:
        return {
          style: "bg-yellow-100 text-yellow-800",
          label: "未着手",
        };
    }
  };

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

            <button
              onClick={handleDeleteChecklist}
              className="flex items-center p-2 bg-red-500 bg-opacity-90 rounded-lg"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span className="hidden sm:inline">削除</span>
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
                  <span className="text-gray-900">
                    {new Date(checklist.workDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div>
                <span className="text-gray-500">現場名: </span>
                <span className="text-gray-900">{checklist?.siteName}</span>
              </div>
              <div>
                <span className="text-gray-500">ステータス: </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    getStatusColor(checklist?.status).style
                  }`}
                >
                  {getStatusColor(checklist?.status).label}
                </span>
              </div>
              <div>
                <span className="text-gray-500">作成日: </span>
                {checklist?.createdAt && (
                  <span className="text-gray-900">
                    {new Date(checklist.createdAt).toLocaleDateString()}
                  </span>
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
                {categoryItems.map((item) => {
                  const isUpdating = updatingItemIds.has(item.id);
                  return (
                  <label
                    key={`${item.name}-${item.id}`}
                    className={`bg-white p-4 rounded-lg shadow-sm flex items-start transition-colors ${
                      isUpdating
                        ? "opacity-60 cursor-wait"
                        : "cursor-pointer hover:bg-gray-50"
                    }`}
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={item.status === "Completed"}
                        disabled={isUpdating}
                        onChange={(e) => {
                          handleCheckboxChange(item.id, e.target.checked);
                        }}
                        className={`h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1 ${
                          isUpdating ? "cursor-wait" : "cursor-pointer"
                        }`}
                      />
                      {isUpdating && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>

                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <span
                          className={`font-medium ${
                            item.status === "Completed"
                              ? "line-through text-gray-500"
                              : "text-gray-900"
                          }`}
                        >
                          {item.name}
                        </span>
                        {(item.quantity !== null && item.quantity !== undefined) && (
                          <span className="text-sm text-gray-500">
                            {item.quantity}{item.unit ? ` ${item.unit}` : "個"}
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
                  </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 全て完了ボタン */}
          {items.length > 0 && items.some((item) => item.status === "NotStarted") && (
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
