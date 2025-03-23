'use client'

import BackIcon from '@/components/icons/BackIcon';
import PlusIcon from '@/components/icons/PlusIcon';
import TrashIcon from '@/components/icons/TrashIcon';
import { supabase } from '@/lib/supabase';
import { CheckListItem } from '@prisma/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const NewChecklistPage = () => {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    siteName: '',
    workDate: new Date().toISOString().split('T')[0], // 今日の日付
    isTemplate: false,
  })

  // カテゴリー関連の状態
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // アイテム管理の状態
  const [items, setItems] = useState<CheckListItem[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    unit: '',
  })

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 初期化の処理
  useEffect(() => {
    console.log("hello");
    // ユーザー情報取得
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if(!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      console.log('User:', user);
      // カテゴリー取得
      fetchCategories();
    }

    console.log("-------------------------")
    checkUser();
  }, [router]);


  // カテゴリー一覧を取得
  const fetchCategories = async () => {
    try {
      // supabaseからカテゴリーを取得
      const { data, error } = await supabase
      .from('Categories')
      .select('*')
      .order('displayOrder', { ascending: true });

      if (error) {
        throw error;
      }

      setCategories(data || []);

      // カテゴリーがあれば最初のカテゴリーを選択状態にする
      if (data && data.length > 0) {
        setSelectedCategoryId(data[0].id);
      }

      console.log('Categories:', data);

    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('カテゴリーの取得に失敗しました');
    }
  }

  // フォーム入力の変更を処理する関数
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // チェックボックスの場合は特別な処理
    if(type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return
    }


    // 通常のフォーム入力の場合
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  // 新しいアイテムの入力変更を処理する関数
  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  }


  // アイテムをリストに追加する関数
  const handleAddItem = () => {
    // 入力チェック
    if (!newItem.name.trim()) {
      setError('アイテム名を入力してください');
      return;
    }

    // アイテムを追加
    const item ={
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      categoryId: selectedCategoryId,
      categoryName: categories.find(c => c.id === selectedCategoryId)?.name || '',
    };

    // アイテムリストに追加
    setItems(prev => [...prev, item]);

    // 入力値をクリア
    setNewItem({
      name: '',
      quantity: '',
      unit: '',
    })

    setError(null);
  };

  // アイテムを削除する関数
  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const errors = { ...formErrors };

    let hasError = false;

    try {
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

      if (items.length === 0) {
        setError("アイテムを1つ以上追加してください");
        hasError = true;
      }

      if (hasError) {
        setFormErrors(errors);
        setLoading(false);
        return;
      }

      // チェックリストを作成するAPIを呼び出し
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
          status: "Pending", // 初期ステータスは未完了
        }),
      });

      if (!checklistResponse.ok) {
        const errorData = await checklistResponse.json();
        throw new Error(errorData.error || "チェックリストの作成に失敗しました");
      }

      // 作成したチェックリストのIDを取得
      const checklistData = await checklistResponse.json();
      const checklistId = checklistData.id;

      // // 各アイテムをAPIを使って追加
      // for (const item of items) {
      //   const itemResponse = await fetch(`/api/checklists/${checklistId}/items`, {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: token || "",
      //     },
      //     body: JSON.stringify({
      //       name: item.name,
      //       quantity: item.quantity ? parseInt(item.quantity) : null,
      //       unit: item.unit,
      //       categoryId: item.categoryId,
      //       status: "Pending", // 初期ステータスは未完了
      //     }),
      //   });

      //   if (!itemResponse.ok) {
      //     const errorData = await itemResponse.json();
      //     throw new Error(errorData.error || "アイテムの追加に失敗しました");
      //   }
      // }
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
              status: "Pending",
            }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "アイテムの追加に失敗しました");
          }
        })
      );


      // 成功メッセージを表示
      setSuccess("チェックリストを作成しました");

      // 一覧ページに戻る【少し遅延させて成功メッセージを見せる】
      setTimeout(() => {
        router.push("/checklists");
      }, 1500);
    } catch (error) {
      console.error("Error creating checklist:", error);
      setError("チェックリストの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
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
          {loading ? '保存中...' : '保存'}
        </button>
      </header>

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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-bold mb-4">基本情報</h2>

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
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="例: 〇〇建設現場 1F工事"
                />
              </div>

              {/* 説明 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="例: 1階部分の内装工事に必要な工具・材料"
                />
              </div>

              {/* 現場名 */}
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">
                  現場名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="siteName"
                  name="siteName"
                  type="text"
                  value={formData.siteName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="例: 〇〇マンション新築工事"
                />
              </div>

              {/* 作業日 */}
              <div>
                <label htmlFor="workDate" className="block text-sm font-medium text-gray-700 mb-1">
                  作業日 <span className="text-red-500">*</span>
                </label>
                <input
                  id="workDate"
                  name="workDate"
                  type="date"
                  value={formData.workDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* テンプレートフラグ */}
              <div className="flex items-center">
                <input
                  id="isTemplate"
                  name="isTemplate"
                  type="checkbox"
                  checked={formData.isTemplate}
                  onChange={(e) => setFormData(prev => ({ ...prev, isTemplate: e.target.checked }))}
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
            <h2 className="text-lg font-bold mb-4">アイテム追加</h2>

            {/* カテゴリー選択 */}
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリー <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={selectedCategoryId || ''}
                onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="" disabled>カテゴリーを選択</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 新規アイテム入力フォーム */}
            <div className="flex flex-col space-y-3 mb-4">
              <input
                type="text"
                name="name"
                value={newItem.name}
                onChange={handleNewItemChange}
                placeholder="アイテム名"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <div className="flex space-x-2">
                <input
                  type="number"
                  name="quantity"
                  value={newItem.quantity}
                  onChange={handleNewItemChange}
                  placeholder="数量"
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="unit"
                  value={newItem.unit}
                  onChange={handleNewItemChange}
                  placeholder="単位（個、台など）"
                  className="w-2/3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center"
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
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {item.categoryName}
                          {item.quantity && ` • ${item.quantity} ${item.unit || '個'}`}
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
      </main>
    </div>
  );
}

export default NewChecklistPage
