import { useRouter } from "next/navigation";
import BackIcon from "../icons/BackIcon";
import TrashIcon from "../icons/TrashIcon";
import PlusIcon from "../icons/PlusIcon";

import { useFormContext } from "react-hook-form";
import { FormInputs, formProps } from "@/app/_types/formProps";
import { useEffect, useState } from "react";

export default function ChecklistForm({
  categories,
  items,
  newItem,
  selectedCategoryId,
  setSelectedCategoryId,
  handleAddItem,
  handleRemoveItem,
  loading,
  setLoading,
  error,
  success,
  isEdit,
  onSubmit,
  setNewItem,
  handleArchiveChecklist,
  handleDeleteChecklist,
  token,
  setCategories,
  setError,
}: formProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    resetField,
    getValues,
  } = useFormContext<FormInputs>();

  // タッチ状態を管理
  const [touched, setTouched] = useState({
    category: false,
    itemName: false,
    quantity: false,
  });

  // バリデーション状態を計算
  const hasErrors = {
    category: touched.category && !selectedCategoryId,
    itemName: touched.itemName && !newItem.name?.trim(),
    quantity: touched.quantity && (!newItem.quantity || Number(newItem.quantity) <= 0),
  };

  useEffect(() => {
    if (!token) return;

    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/categories", {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        });

        if (!res.ok) throw new Error("カテゴリーの取得に失敗しました");

        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("カテゴリー取得エラー", err);
        setError("カテゴリーの取得に失敗しました");
      } finally {
        //データの取得が完了したらローディング終了
        setLoading(false);
      }
    };

    fetchCategories();
  }, [token, reset, setCategories, setSelectedCategoryId]);

  console.log("初期データ", getValues); // 値があるか確認
  const isAddDisabled =
    !newItem.name?.trim() ||
    !newItem.quantity ||
    Number(newItem.quantity) <= 0 ||
    isNaN(Number(newItem.quantity)) ||
    !selectedCategoryId;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      {/* isEditがtrueの場合は編集画面、falseの場合は新規作成画面 */}
      {/* 画面遷移のためにrouter.pushを使用 */}
      {isEdit ? (
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
            <h1 className="text-xl font-bold">チェックリスト編集</h1>
            <div className="flex space-x-2">
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
                className="px-4 py-2 bg-white bg-opacity-20 rounded-lg text-sm disabled:opacity-50"
              >
                {loading ? "保存中..." : "保存"}
              </button>
              {handleArchiveChecklist && (
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
              )}

              {handleDeleteChecklist && (
                <button
                  onClick={handleDeleteChecklist}
                  className="flex items-center p-2 bg-red-500 bg-opacity-90 rounded-lg"
                >
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span className="hidden sm:inline">削除</span>
                </button>
              )}
            </div>
          </div>
        </header>
      ) : (
        <header className="bg-blue-600 text-white p-4 sticky top-0 z-10 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.back()} className="p-1">
              <BackIcon />
            </button>
            <h1 className="text-xl font-bold">新規チェックリスト</h1>
          </div>
          <button
            // onClick={handleSubmit}
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="px-4 py-2 bg-white bg-opacity-20 rounded-lg text-sm disabled:opacity-50"
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </header>
      )}

      <main className="p-4 pb-20">
        {/* エラーメッセージ */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* 成功メッセージ */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 基本情報 */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-black">基本情報</h2>

              <div className="space-y-4">
                {/* チェックリスト名 */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    チェックリスト名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register("name", {
                      required: "チェックリスト名は必須です",
                      maxLength: {
                        value: 25,
                        message: "チェックリスト名は25文字以内で入力してください",
                      },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                    placeholder="例: 〇〇建設現場 1F工事"
                  />
                  {errors.name && <p className="text-red-500">{errors.name.message}</p>}
                </div>

                {/* 説明 */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    説明
                  </label>
                  <textarea
                    id="description"
                    {...register("description")}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                    placeholder="例: 1階部分の内装工事に必要な工具・材料"
                  />
                </div>

                {/* 現場名 */}
                <div>
                  <label
                    htmlFor="siteName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    現場名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="siteName"
                    type="text"
                    {...register("siteName", {
                      required: "現場名は必須です",
                      maxLength: {
                        value: 25,
                        message: "現場名は25文字以内で入力してください",
                      },
                    })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                    placeholder="例: 〇〇マンション新築工事"
                  />
                  {errors.siteName && (
                    <p className="mt-1 text-sm text-red-600">{errors.siteName.message}</p>
                  )}
                </div>

                {/* 作業日 */}
                <div>
                  <label
                    htmlFor="workDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    作業日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="workDate"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    {...register("workDate", {
                      required: "作業日は必須です",
                      validate: (value) => {
                        if (!value) return true;

                        const inputDate = new Date(value);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0); // 時間を0にして日付だけ比較

                        // isEditがfalse（新規作成）なら未来日チェック
                        if (!isEdit && inputDate < today) {
                          return "作業日は今日以降の日付を選択してください";
                        }
                        return true;
                      },
                    })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                  />
                  {errors.workDate && <p className="text-red-500">{errors.workDate.message}</p>}
                </div>

                {/* テンプレートフラグ todo アーカイブの処理を後実装する 一時disabled*/}
                <div className="flex items-center">
                  <input
                    id="isTemplate"
                    type="checkbox"
                    {...register("isTemplate")}
                    disabled
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="isTemplate" className="ml-2 text-sm text-gray-700">
                    テンプレートとして保存する(処理中)
                  </label>
                </div>
              </div>
            </div>

            {/* アイテム追加 */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-black">アイテム追加</h2>

              {/* カテゴリー選択 */}
              <div className="mb-4">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリー <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  value={selectedCategoryId || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const categoryId = value ? Number(value) : null;
                    setSelectedCategoryId(categoryId);
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, category: true }))} // タッチ状態を更新
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 text-black ${
                    hasErrors.category
                      ? "border-red-500 bg-red-50 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                >
                  <option value="" disabled>
                    カテゴリーを選択してください
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {hasErrors.category && (
                  <p className="mt-1 text-sm text-red-600">カテゴリーを選択してください</p>
                )}
              </div>

              {/* 新規アイテム入力フォーム */}
              <div className="flex flex-col space-y-3 mb-4">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  アイテム詳細 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newItem.name || ""}
                  onChange={(e) => {
                    setNewItem((prev) => ({ ...prev, name: e.target.value }));
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, itemName: true }))} // タッチ状態を更新
                  placeholder="アイテム名"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 text-black ${
                    hasErrors.itemName
                      ? "border-red-500 bg-red-50 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {hasErrors.itemName && (
                  <p className="mt-1 text-sm text-red-600">アイテム名を入力してください</p>
                )}

                {/* 数量と単位 */}
                <div className="flex space-x-2">
                  <div className="w-1/3">
                    <input
                      type="number"
                      value={newItem.quantity || ""}
                      onChange={(e) => {
                        setNewItem((prev) => ({ ...prev, quantity: e.target.value }));
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, quantity: true }))} // タッチ状態を更新
                      min={1}
                      max={100}
                      step={1}
                      placeholder="数量"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 text-black ${
                        hasErrors.quantity
                          ? "border-red-500 bg-red-50 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                    />
                    {hasErrors.quantity && (
                      <p className="mt-1 text-sm text-red-600">1以上の数量を入力してください</p>
                    )}
                  </div>

                  <input
                    type="text"
                    value={newItem.unit || ""}
                    onChange={(e) => {
                      setNewItem((prev) => ({ ...prev, unit: e.target.value }));
                    }}
                    placeholder="単位（個、台など）"
                    className="w-2/3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleAddItem();

                    // フィールドのリセット
                    resetField("newItem.name");
                    resetField("newItem.quantity");
                    resetField("newItem.unit");

                    // カテゴリー選択をリセット
                    setSelectedCategoryId(null);

                    // タッチ状態もリセット
                    setTouched({
                      category: false,
                      itemName: false,
                      quantity: false,
                    });
                  }}
                  className={`w-full py-2 rounded-lg flex items-center justify-center transition-colors ${
                    isAddDisabled
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                  disabled={isAddDisabled}
                >
                  <PlusIcon />
                  <span className="ml-2">アイテムを追加</span>
                </button>
              </div>

              {/* 追加済みアイテムリスト */}
              <div className="space-y-3 mt-6">
                <h3 className="font-medium text-gray-700">追加済みアイテム ({items.length})</h3>

                {items.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    アイテムがまだ追加されていません
                  </p>
                ) : (
                  <div className="border border-gray-200 rounded-lg divide-y">
                    {items.map((item, index) => (
                      <div key={index} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-black">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            {categories.find((c) => c.id === item.categoryId)?.name}
                            {item.quantity && ` • ${item.quantity} ${item.unit || "個"}`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
