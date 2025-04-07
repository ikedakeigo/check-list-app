"use client";

import useAuthCheck from "@/app/_hooks/useAuthCheck";
import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import { AddCategory, CategoryRequestBody } from "@/app/_types/category";
import { NewItem } from "@/app/_types/checkListItems";
import { ChecklistFormData } from "@/app/_types/checklists";
import ChecklistForm from "@/components/form/ChecklistForm";
import { User } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

const NewChecklistPage = () => {
  const router = useRouter();
  const useAuth = useAuthCheck();

  const { id } = useParams();

  const { token } = useSupabaseSession();
  const [, setUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<ChecklistFormData>({
    name: "",
    description: "",
    siteName: "",
    workDate: new Date().toISOString().split("T")[0], // 今日の日付
    isTemplate: false,
  });

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    siteName?: string;
    workDate?: string;
  }>({});

  // カテゴリー関連の状態
  const [categories, setCategories] = useState<AddCategory>([]);

  // 選択中のカテゴリーID
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // アイテム管理の状態
  const [items, setItems] = useState<NewItem[]>([]);

  // 新しいアイテムの入力状態
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    unit: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  const fetchChecklist = useCallback(async () => {
    if (!token) return;
    // チェックリストの詳細を取得
    try {
      const res = await fetch(`/api/checklists/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });
      if (!res.ok) throw new Error("チェックリストの取得に失敗しました");

      const data = await res.json();

      setFormData({
        name: data.name || "",
        description: data.description || "",
        siteName: data.siteName || "",
        workDate: data.workDate ? new Date(data.workDate).toISOString().split("T")[0] : "",
        isTemplate: data.isTemplate || false,
      });

      // アイテムを取得
      const itemsRes = await fetch(`/api/checklists/${id}/items`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });


      if (!itemsRes.ok) throw new Error("アイテムの取得に失敗しました");

      const itemsData = await itemsRes.json();

      // アイテムをセット
      const formattedItems = itemsData.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity ? item.quantity.toString() : "",
        unit: item.unit || "",
        categoryId: item.categoryId,
        categoryName: item.category.name,
        status: item.status,
      }));

      setItems(formattedItems);
      setSelectedCategoryId(formattedItems[0]?.categoryId || null); // 最初のアイテムのカテゴリーIDを選択
    } catch (error) {
      console.error("エラーが発生しました", error);
      setError("カテゴリーの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  // カテゴリーを取得する関数
  const fetchCategories = useCallback(async () => {
    if (!token) return;
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

      if (data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data[0].id); // 最初のカテゴリーを選択
      }
    } catch (error) {
      console.error("エラーが発生しました", error);
      setError("カテゴリーの取得に失敗しました");
    }
  }, [token, selectedCategoryId]);

  useEffect(() => {
    // tokenがない場合は何もしない
    if (!useAuth || !token) return;
    setUser(useAuth);
    fetchChecklist();
    fetchCategories();

    setLoading(true);
  }, [useAuth, token]);

  // チェックリストフォーム入力の変更を処理する関数
  /**
   * イベントからname,value,typeを取得し、
   */
  const handleNewChecklistChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    // チェックボックスの場合は特別な処理
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    // 通常のフォーム入力の場合
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" })); // エラーメッセージをクリア
  };

  // 新しいアイテムの入力変更を処理する関数
  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  // アイテムをリストに追加する関数
  const handleAddItem = () => {
    // 入力チェック
    if (!newItem.name.trim()) {
      setError("アイテム名を入力してください");
      return;
    }

    // アイテムを追加
    const item = {
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      categoryId: selectedCategoryId,
      categoryName: categories.find((c) => c.id === selectedCategoryId)?.name || "",
    };

    // アイテムリストに追加
    // スプレット構文を使用して新しいアイテムを追加する
    // ...prevには既存のアイテムが入っている
    setItems((prev) => [...prev, item]);

    // 入力値をクリア
    setNewItem({
      name: "",
      quantity: "",
      unit: "",
    });

    setError(null);
  };

  // アイテムを削除する関数
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const errors = { ...formErrors };

    let hasError = false;

    // 入力チェック
    if (!formData.name.trim()) {
      errors.name = "チェックリスト名を入力してください";
      hasError = true;
    }

    if (!formData.workDate) {
      errors.workDate = "作業日を入力してください";
      hasError = true;
    }

    if (!formData.siteName.trim()) {
      errors.siteName = "現場名を入力してください";
      hasError = true;
    }

    if (hasError) {
      setFormErrors(errors);
      setLoading(false);
      return;
    }

    try {
      if (id) {
        // 編集の場合
        await fetch(`/api/checklists/${id}/items`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: token || "",
          },
        });

        const checklistResponse = await fetch(`/api/checklists/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token || "",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            workDate: formData.workDate,
            siteName: formData.siteName,
            isTemplate: formData.isTemplate,
          }),
        });

        if (!checklistResponse.ok) {
          const errorData = await checklistResponse.json();
          throw new Error(errorData.error || "チェックリストの更新に失敗しました");
        }

        // アイテム追加処理
        await Promise.all(
          items.map(async (item) => {
            await fetch(`/api/checklists/${id}/items`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: token || "",
              },
              body: JSON.stringify({
                name: item.name,
                quantity: item.quantity ? parseInt(item.quantity) : null,
                unit: item.unit,
                categoryId: item.categoryId,
                status: "NotStarted",
              }),
            });
          })
        );

        setSuccess("チェックリストを更新しました");
      } else {
        // 新規作成の場合
        const checklistResponse = await fetch("/api/checklists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token || "",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            workDate: formData.workDate,
            siteName: formData.siteName,
            isTemplate: formData.isTemplate,
            status: "NotStarted",
          }),
        });

        if (!checklistResponse.ok) {
          const errorData = await checklistResponse.json();
          throw new Error(errorData.error || "チェックリストの作成に失敗しました");
        }

        // 作成したチェックリストのIDを取得
        const checklistData = await checklistResponse.json();

        const checklistId = checklistData.id;

        // アイテム追加処理
        await Promise.all(
          items.map(async (item) => {
            const res = await fetch(`/api/checklists/${checklistId}/items`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: token || "",
              },
              body: JSON.stringify({
                name: item.name,
                quantity: item.quantity ? parseInt(item.quantity) : null,
                unit: item.unit,
                categoryId: item.categoryId,
                status: "NotStarted",
              }),
            });

            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.error || "アイテムの追加に失敗しました");
            }
          })
        );

        setSuccess("チェックリストを作成しました");
      }

      // 一覧ページに戻る
      setTimeout(() => {
        router.push("/checklists");
      }, 1500);
    } catch (error) {
      console.error("Error:", error);
      setError(id ? "チェックリストの更新に失敗しました" : "チェックリストの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChecklistForm
      formData={formData}
      setFormData={setFormData} // setFormDataを渡す
      formErrors={formErrors}
      categories={categories}
      selectedCategoryId={selectedCategoryId}
      setSelectedCategoryId={setSelectedCategoryId}
      items={items}
      newItem={newItem}
      handleNewChecklistChange={handleNewChecklistChange}
      handleNewItemChange={handleNewItemChange}
      handleAddItem={handleAddItem}
      handleRemoveItem={handleRemoveItem}
      handleSubmit={handleSubmit}
      loading={loading}
      error={error}
      success={success}
      isEdit={true}
    />
    // <div className="min-h-screen bg-gray-50">
    //   {/* ヘッダー */}
    //   <header className="bg-blue-600 text-white p-4 sticky top-0 z-10 flex justify-between items-center">
    //     <div className="flex items-center space-x-4">
    //       <button onClick={() => router.back()} className="p-1">
    //         <BackIcon />
    //       </button>
    //       <h1 className="text-xl font-bold">新規チェックリスト</h1>
    //     </div>
    //     <button
    //       onClick={handleSubmit}
    //       disabled={loading}
    //       className="px-4 py-2 bg-white bg-opacity-20 rounded-lg text-sm disabled:opacity-50"
    //     >
    //       {loading ? "保存中..." : "保存"}
    //     </button>
    //   </header>

    //   <main className="p-4 pb-20">
    //     {/* エラーメッセージ */}
    //     {error && (
    //       <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
    //         {error}
    //       </div>
    //     )}

    //     {/* 成功メッセージ */}
    //     {success && (
    //       <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
    //         {success}
    //       </div>
    //     )}

    //     {loading ? (
    //       <div className="flex justify-center items-center h-64">
    //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    //       </div>
    //     ) : (
    //       <form onSubmit={handleSubmit} className="space-y-6">
    //         {/* 基本情報 */}
    //         <div className="bg-white p-4 rounded-lg shadow-sm">
    //           <h2 className="text-lg font-bold mb-4 text-black">基本情報</h2>

    //           <div className="space-y-4">
    //             {/* チェックリスト名 */}
    //             <div>
    //               <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
    //                 チェックリスト名 <span className="text-red-500">*</span>
    //               </label>
    //               <input
    //                 id="name"
    //                 name="name"
    //                 type="text"
    //                 value={formData.name}
    //                 onChange={handleNewChecklistChange}
    //                 required
    //                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
    //                 placeholder="例: 〇〇建設現場 1F工事"
    //               />
    //               {formErrors.name && (
    //                 <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
    //               )}
    //             </div>

    //             {/* 説明 */}
    //             <div>
    //               <label
    //                 htmlFor="description"
    //                 className="block text-sm font-medium text-gray-700 mb-1"
    //               >
    //                 説明
    //               </label>
    //               <textarea
    //                 id="description"
    //                 name="description"
    //                 value={formData.description}
    //                 onChange={handleNewChecklistChange}
    //                 rows={3}
    //                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
    //                 placeholder="例: 1階部分の内装工事に必要な工具・材料"
    //               />
    //             </div>

    //             {/* 現場名 */}
    //             <div>
    //               <label
    //                 htmlFor="siteName"
    //                 className="block text-sm font-medium text-gray-700 mb-1"
    //               >
    //                 現場名 <span className="text-red-500">*</span>
    //               </label>
    //               <input
    //                 id="siteName"
    //                 name="siteName"
    //                 type="text"
    //                 value={formData.siteName}
    //                 onChange={handleNewChecklistChange}
    //                 required
    //                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
    //                 placeholder="例: 〇〇マンション新築工事"
    //               />
    //               {formErrors.siteName && (
    //                 <p className="mt-1 text-sm text-red-600">{formErrors.siteName}</p>
    //               )}
    //             </div>

    //             {/* 作業日 */}
    //             <div>
    //               <label
    //                 htmlFor="workDate"
    //                 className="block text-sm font-medium text-gray-700 mb-1"
    //               >
    //                 作業日 <span className="text-red-500">*</span>
    //               </label>
    //               <input
    //                 id="workDate"
    //                 name="workDate"
    //                 type="date"
    //                 value={formData.workDate}
    //                 onChange={handleNewChecklistChange}
    //                 required
    //                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
    //               />
    //             </div>

    //             {/* テンプレートフラグ */}
    //             <div className="flex items-center">
    //               <input
    //                 id="isTemplate"
    //                 name="isTemplate"
    //                 type="checkbox"
    //                 checked={formData.isTemplate}
    //                 onChange={(e) =>
    //                   setFormData((prev) => ({ ...prev, isTemplate: e.target.checked }))
    //                 }
    //                 className="h-4 w-4 text-blue-600 rounded"
    //               />
    //               <label htmlFor="isTemplate" className="ml-2 text-sm text-gray-700">
    //                 テンプレートとして保存する
    //               </label>
    //             </div>
    //           </div>
    //         </div>

    //         {/* アイテム追加 */}
    //         <div className="bg-white p-4 rounded-lg shadow-sm">
    //           <h2 className="text-lg font-bold mb-4 text-black">アイテム追加</h2>

    //           {/* カテゴリー選択 */}
    //           <div className="mb-4">
    //             <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
    //               カテゴリー <span className="text-red-500">*</span>
    //             </label>
    //             <select
    //               id="category"
    //               value={selectedCategoryId || ""}
    //               onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
    //               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
    //             >
    //               <option value="" disabled>
    //                 カテゴリーを選択
    //               </option>
    //               {categories.map((category) => (
    //                 <option key={category.id} value={category.id}>
    //                   {category.name}
    //                 </option>
    //               ))}
    //             </select>
    //           </div>

    //           {/* 新規アイテム入力フォーム */}
    //           <div className="flex flex-col space-y-3 mb-4">
    //             <label htmlFor="category" className="block text-sm font-medium text-gray-700">
    //               アイテム詳細 <span className="text-red-500">*</span>
    //             </label>
    //             <input
    //               type="text"
    //               name="name"
    //               value={newItem.name}
    //               onChange={handleNewItemChange}
    //               placeholder="アイテム名"
    //               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
    //             />

    //             <div className="flex space-x-2">
    //               <input
    //                 type="number"
    //                 name="quantity"
    //                 value={newItem.quantity}
    //                 onChange={handleNewItemChange}
    //                 placeholder="数量"
    //                 className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
    //               />
    //               <input
    //                 type="text"
    //                 name="unit"
    //                 value={newItem.unit}
    //                 onChange={handleNewItemChange}
    //                 placeholder="単位（個、台など）"
    //                 className="w-2/3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
    //               />
    //             </div>

    //             <button
    //               type="button"
    //               onClick={handleAddItem}
    //               className={`w-full py-2 rounded-lg flex items-center justify-center ${
    //                 newItem.name.trim() && newItem.quantity
    //                   ? "bg-blue-600 text-white"
    //                   : "bg-gray-300 text-gray-500"
    //               }`}
    //               disabled={!newItem.name.trim() || !newItem.quantity}
    //             >
    //               <PlusIcon />
    //               <span className="ml-2">アイテムを追加</span>
    //             </button>
    //           </div>

    //           {/* 追加済みアイテムリスト */}
    //           <div className="space-y-3 mt-6">
    //             <h3 className="font-medium text-gray-700">追加済みアイテム ({items.length})</h3>

    //             {items.length === 0 ? (
    //               <p className="text-sm text-gray-500 text-center py-4">
    //                 アイテムがまだ追加されていません
    //               </p>
    //             ) : (
    //               <div className="border border-gray-200 rounded-lg divide-y">
    //                 {items.map((item, index) => (
    //                   <div key={index} className="p-3 flex justify-between items-center">
    //                     <div>
    //                       <div className="font-medium text-black">{item.name}</div>
    //                       <div className="text-sm text-gray-500">
    //                         {categories.find((c) => c.id === item.categoryId)?.name}
    //                         {item.quantity && ` • ${item.quantity} ${item.unit || "個"}`}
    //                       </div>
    //                     </div>
    //                     <button
    //                       type="button"
    //                       onClick={() => handleRemoveItem(index)}
    //                       className="p-2 text-red-600 hover:bg-red-50 rounded-full"
    //                     >
    //                       <TrashIcon />
    //                     </button>
    //                   </div>
    //                 ))}
    //               </div>
    //             )}
    //           </div>
    //         </div>
    //       </form>
    //     )}
    //   </main>
    // </div>
  );
};

export default NewChecklistPage;
