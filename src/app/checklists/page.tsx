"use client";

import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import PlusIcon from "@/components/icons/PlusIcon";
import BackIcon from "@/components/icons/BackIcon";
import useAuthCheck from "../_hooks/useAuthCheck";
import Link from "next/link";
import { CheckListWithItems } from "../_types/checklists";

/**
 * チェックリスト一覧ページ
 *
 * @description
 * ユーザーのチェックリストを一覧表示し、様々な条件でフィルタリング・ソートできる。
 *
 * @features
 * - タブフィルター: すべて / 進行中 / 完了 / テンプレート / アーカイブ
 * - テキスト検索: チェックリスト名・現場名で部分一致検索
 * - 日付範囲フィルター: 作業日の範囲を指定
 * - ソート機能: 作成日 / 更新日 / 作業日 で昇順・降順切り替え
 */
const ChecklistsPage = () => {
  // ========================================
  // ルーターとナビゲーション
  // ========================================
  const router = useRouter();

  // ========================================
  // 状態管理（State）
  // ========================================
  // ユーザー情報: Supabase認証から取得したユーザー
  const [user, setUser] = useState<User | null>(null);

  // ローディング状態: データ取得中は true
  const [loading, setLoading] = useState<boolean>(true);

  // チェックリストデータ: APIから取得した一覧
  const [checklists, setChecklists] = useState<CheckListWithItems[]>([]);

  // タブフィルター: "all" | "active" | "completed" | "templates" | "archived"
  const [selectedFilter, setSelectedFilter] = useState("all");

  // テキスト検索クエリ: 名前・現場名での検索に使用
  const [searchQuery, setSearchQuery] = useState<string>("");

  // エラーメッセージ: API呼び出し失敗時に表示
  const [error, setError] = useState<string | null>(null);

  // 日付フィルター: 作業日の開始日・終了日（YYYY-MM-DD形式）
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // ソート設定:
  // - sortBy: "createdAt"（作成日）| "updatedAt"（更新日）| "workDate"（作業日）
  // - sortOrder: "asc"（昇順）| "desc"（降順）
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  // ========================================
  // API クエリパラメータの構築
  // ========================================
  /**
   * フィルター・ソート条件からURLクエリパラメータを構築する
   *
   * @description
   * 各フィルター条件をAPIが理解できる形式に変換する。
   * タブフィルターは内部的な値（"active"など）からAPI用の値（"status=Pending"など）に変換。
   *
   * @returns URLSearchParams形式の文字列（例: "status=Pending&sortBy=createdAt&sortOrder=desc"）
   */
  const buildQueryParams = (): string => {
    const params = new URLSearchParams();

    // タブフィルターの変換
    // UIのタブ名 → API用のクエリパラメータに変換
    switch (selectedFilter) {
      case "active":
        // 「進行中」タブ: status が Pending のものを取得
        params.set("status", "Pending");
        break;
      case "completed":
        // 「完了」タブ: status が Completed のものを取得
        params.set("status", "Completed");
        break;
      case "templates":
        // 「テンプレート」タブ: isTemplate が true のものを取得
        params.set("isTemplate", "true");
        break;
      case "archived":
        // 「アーカイブ」タブ: archivedAt が null でないものを取得
        params.set("isArchived", "true");
        break;
      // "all" の場合はフィルター条件なし（全件取得）
    }

    // テキスト検索: 空でない場合のみパラメータに追加
    if (searchQuery) {
      params.set("searchQuery", searchQuery);
    }

    // 日付フィルター: 設定されている場合のみパラメータに追加
    if (dateFrom) {
      params.set("dateFrom", dateFrom);
    }
    if (dateTo) {
      params.set("dateTo", dateTo);
    }

    // ソート設定: 常にパラメータに含める（デフォルト値使用時も）
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);

    return params.toString();
  };

  // ========================================
  // 認証チェック
  // ========================================
  // カスタムフックでログイン状態を確認し、ユーザー情報を取得
  const authUser = useAuthCheck();

  // 認証ユーザー情報が取得できたら state に設定
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    }
  }, [authUser]);

  // ========================================
  // データ取得のトリガー
  // ========================================
  /**
   * フィルター条件が変更されたらチェックリストを再取得
   *
   * @description
   * 依存配列に含まれる値のいずれかが変更されると、
   * fetchChecklists() が実行されてデータが更新される。
   * これにより、ユーザーがフィルターを変更すると即座に結果が反映される。
   */
  useEffect(() => {
    if (user) {
      fetchChecklists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedFilter, searchQuery, dateFrom, dateTo, sortBy, sortOrder]);

  // ========================================
  // API呼び出し
  // ========================================
  /**
   * チェックリスト一覧をAPIから取得する
   *
   * @description
   * buildQueryParams() で構築したクエリパラメータを使用して
   * /api/checklists エンドポイントにリクエストを送信。
   * 成功時はチェックリストを state に設定、失敗時はエラーを表示。
   */
  const fetchChecklists = async () => {
    try {
      setLoading(true);
      setError(null); // 前回のエラーをクリア

      // クエリパラメータを構築してAPIを呼び出し
      const queryString = buildQueryParams();
      const res = await fetch(`/api/checklists?${queryString}`);
      const data = await res.json();

      // レスポンスがエラーの場合は例外をスロー
      if (!res.ok) {
        throw new Error(data.error || "エラーが発生しました");
      }

      // 取得したデータを state に設定
      setChecklists(data);
    } catch (error) {
      console.error("チェックリスト取得エラー:", error);
      setError("チェックリストの取得に失敗しました");
    } finally {
      // 成功・失敗に関わらずローディング状態を解除
      setLoading(false);
    }
  };

  // ========================================
  // イベントハンドラー
  // ========================================
  /**
   * チェックリストカードクリック時の処理
   * 詳細ページへ遷移する
   *
   * @param id - チェックリストのID
   */
  const handleViewChecklist = (id: number) => {
    router.push(`/checklists/${id}`);
  };

  // ========================================
  // フィルタータブの定義
  // ========================================
  /**
   * タブフィルターの設定
   * id: クエリパラメータ構築時に使用する内部値
   * label: UIに表示するラベル
   */
  const filterTabs = [
    { id: "all", label: "すべて" },        // 全件表示（フィルターなし）
    { id: "active", label: "進行中" },     // status = Pending
    { id: "completed", label: "完了" },    // status = Completed
    { id: "templates", label: "テンプレート" }, // isTemplate = true
    { id: "archived", label: "アーカイブ" },    // archivedAt != null
  ];

  // ========================================
  // ステータスバッジのスタイル判定
  // ========================================
  /**
   * チェックリストのステータスに応じたバッジのスタイルとラベルを返す
   *
   * @param checklist - チェックリストオブジェクト
   * @returns { className: string, label: string }
   */
  const getStatusBadge = (checklist: CheckListWithItems) => {
    if (checklist.status === "Completed") {
      return { className: "bg-green-100 text-green-800", label: "完了" };
    }
    if (checklist.isTemplate) {
      return { className: "bg-purple-100 text-purple-800", label: "テンプレート" };
    }
    if (checklist.archivedAt) {
      return { className: "bg-gray-100 text-gray-800", label: "アーカイブ" };
    }
    if (checklist.status === "Pending") {
      return { className: "bg-yellow-100 text-yellow-800", label: "進行中" };
    }
    // NotStarted（未着手）
    return { className: "bg-red-100 text-red-800", label: "未着手" };
  };

  // ========================================
  // レンダリング
  // ========================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========================================
          ヘッダーセクション
          - 戻るボタン、タイトル、新規作成ボタン
          - テキスト検索フォーム
          ======================================== */}
      <header className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          {/* 左側: 戻るボタン + タイトル */}
          <div className="flex items-center space-x-2">
            <Link href="/">
              <BackIcon />
            </Link>
            <h1 className="text-xl font-bold">チェックリスト一覧</h1>
          </div>
          {/* 右側: 新規作成ボタン */}
          <Link
            href="/checklists/new"
            className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors"
          >
            <PlusIcon />
          </Link>
        </div>

        {/* テキスト検索フォーム */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="チェックリスト名・現場名で検索..."
            className="w-full px-3 py-2 pl-10 bg-white bg-opacity-20 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white"
          />
          {/* 検索アイコン */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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

      {/* ========================================
          フィルタータブセクション
          - すべて / 進行中 / 完了 / テンプレート / アーカイブ
          ======================================== */}
      <div className="bg-white border-b">
        <div className="flex overflow-x-auto p-2 space-x-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm transition-colors ${
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

      {/* ========================================
          日付フィルター・ソートセクション
          - 作業日の範囲指定
          - ソート対象フィールド選択
          - 昇順/降順切り替え
          ======================================== */}
      <div className="bg-white border-b p-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* 日付範囲フィルター */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">作業日:</label>
            {/* 開始日 */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-gray-500">〜</span>
            {/* 終了日 */}
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* ソート設定 */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm text-gray-600">並び替え:</label>
            {/* ソート対象フィールド選択 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="createdAt">作成日</option>
              <option value="updatedAt">更新日</option>
              <option value="workDate">作業日</option>
            </select>
            {/* 昇順/降順切り替えボタン */}
            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              title={sortOrder === "desc" ? "降順（新しい順）" : "昇順（古い順）"}
            >
              {sortOrder === "desc" ? "↓ 新しい順" : "↑ 古い順"}
            </button>
          </div>

          {/* 日付フィルタークリアボタン（日付が設定されている場合のみ表示） */}
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
            >
              日付クリア
            </button>
          )}
        </div>
      </div>

      {/* ========================================
          チェックリスト一覧セクション
          - ローディング表示
          - エラー表示
          - 空状態表示
          - チェックリストカード
          ======================================== */}
      <div className="p-4">
        {/* ローディング表示 */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          /* エラー表示 */
          <div className="bg-red-50 p-4 rounded-lg text-red-600 text-center">
            {error}
          </div>
        ) : checklists.length === 0 ? (
          /* 空状態表示 */
          <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
            チェックリストがありません
          </div>
        ) : (
          /* チェックリスト一覧 */
          <div className="space-y-3">
            {checklists.map((checklist) => {
              // ステータスバッジの情報を取得
              const badge = getStatusBadge(checklist);

              return (
                <div
                  key={checklist.id}
                  className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewChecklist(checklist.id)}
                >
                  {/* ヘッダー: チェックリスト名 + ステータスバッジ */}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg text-gray-900">
                      {checklist.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* 作業日 + 現場名 */}
                  <div className="text-sm text-gray-500 mb-3">
                    {new Date(checklist.workDate).toLocaleDateString()} -{" "}
                    {checklist.siteName}
                  </div>

                  {/* 進捗バー */}
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            ((checklist.completedItems || 0) /
                              (checklist.totalItems || 1)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    {/* 完了数 / 総数 */}
                    <span className="ml-4 text-sm text-gray-600">
                      {checklist.completedItems || 0}/{checklist.totalItems || "?"}
                    </span>
                  </div>

                  {/* 説明文（存在する場合のみ表示、2行で省略） */}
                  {checklist.description && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                      {checklist.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistsPage;
