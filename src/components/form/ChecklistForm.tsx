import { AddCategory } from "@/app/_types/category";
import { CheckLists } from "@prisma/client";
import { useRouter } from "next/navigation";
import BackIcon from "../icons/BackIcon";
import TrashIcon from "../icons/TrashIcon";
import PlusIcon from "../icons/PlusIcon";
import { ChecklistFormData } from "@/app/_types/checklists";
import { NewItem } from "@/app/_types/checkListItems";

type Props = {
  formData: ChecklistFormData;
  formErrors: { [key: string]: string };
  categories: AddCategory;
  selectedCategoryId: number | null;
  setSelectedCategoryId: (id: number) => void;
  items: NewItem[]; 
  newItem: NewItem;
  handleNewChecklistChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleNewItemChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddItem: () => void;
  handleRemoveItem: (index: number) => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  success: string | null;

  // オプショナルなプロパティ
  isEdit?: boolean;
  checklist?: CheckLists | null;
  id?: string | number;
  setFormData?: React.Dispatch<React.SetStateAction<ChecklistFormData>>;
  handleArchiveChecklist?: () => void;
  handleDeleteChecklist?: () => void;
};

export default function ChecklistForm({
  formData,
  setFormData,
  formErrors,
  handleAddItem,
  handleRemoveItem,
  newItem,
  handleNewItemChange,
  selectedCategoryId,
  setSelectedCategoryId,
  items,
  categories,
  handleSubmit,
  isEdit,
  handleArchiveChecklist,
  handleDeleteChecklist,
  loading,
  error,
  success,
  handleNewChecklistChange,
}: Props) {

  const router = useRouter();

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
                onClick={handleSubmit}
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
            onClick={handleSubmit}
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
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleNewChecklistChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                    placeholder="例: 〇〇建設現場 1F工事"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
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
                    name="description"
                    value={formData.description}
                    onChange={handleNewChecklistChange}
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
                    name="siteName"
                    type="text"
                    value={formData.siteName}
                    onChange={handleNewChecklistChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                    placeholder="例: 〇〇マンション新築工事"
                  />
                  {formErrors.siteName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.siteName}</p>
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
                    name="workDate"
                    type="date"
                    value={formData.workDate}
                    onChange={handleNewChecklistChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                  />
                </div>

                {/* テンプレートフラグ */}
                <div className="flex items-center">
                  <input
                    id="isTemplate"
                    name="isTemplate"
                    type="checkbox"
                    checked={formData.isTemplate}
                    onChange={(e) => {
                      if (setFormData) {
                        setFormData((prev) => ({ ...prev, isTemplate: e.target.checked }));
                      } else {
                        // setFormDataが提供されていない場合は通常のonChangeハンドラーを使用
                        handleNewChecklistChange(e);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="isTemplate" className="ml-2 text-sm text-gray-700">
                    テンプレートとして保存する
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
                  onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                >
                  <option value="" disabled>
                    カテゴリーを選択
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 新規アイテム入力フォーム */}
              <div className="flex flex-col space-y-3 mb-4">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  アイテム詳細 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={newItem.name}
                  onChange={handleNewItemChange}
                  placeholder="アイテム名"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                />

                <div className="flex space-x-2">
                  <input
                    type="number"
                    name="quantity"
                    value={newItem.quantity}
                    onChange={handleNewItemChange}
                    placeholder="数量"
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                  />
                  <input
                    type="text"
                    name="unit"
                    value={newItem.unit}
                    onChange={handleNewItemChange}
                    placeholder="単位（個、台など）"
                    className="w-2/3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className={`w-full py-2 rounded-lg flex items-center justify-center ${
                    newItem.name.trim() && newItem.quantity
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-500"
                  }`}
                  disabled={!newItem.name.trim() || !newItem.quantity}
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
