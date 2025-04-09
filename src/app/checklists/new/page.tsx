"use client";

import useAuthCheck from "@/app/_hooks/useAuthCheck";
import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import { AddCategory, CategoryRequestBody } from "@/app/_types/category";
import { NewItem } from "@/app/_types/checkListItems";
import ChecklistForm from "@/components/form/ChecklistForm";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

const NewChecklistPage = () => {
  const router = useRouter();
  const useAuth = useAuthCheck();

  const { token } = useSupabaseSession();

  const [formData, setFormData] = useState({
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
    categoryId: null,
    categoryName: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // カテゴリー一覧を取得
  const fetchCategories = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch("/api/categories", {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });
      const data: CategoryRequestBody = await res.json();

      if (!res.ok) throw new Error("エラーが発生しました");

      setCategories(data);
      if (data.length > 0) setSelectedCategoryId(data[0].id);
    } catch (error) {
      console.error("エラーが発生しました", error);
      setError("カテゴリーの取得に失敗しました");
    } finally {
      // データの取得が完了したらローディング終了
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!useAuth || !token) return; // ← tokenが無いなら実行しない
    setLoading(true);
    fetchCategories();
  }, [useAuth, fetchCategories]);

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
      categoryId: null,
      categoryName: "",
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
          status: "NotStarted", // 初期ステータスは未完了
        }),
      });

      if (!checklistResponse.ok) {
        const errorData = await checklistResponse.json();
        throw new Error(errorData.error || "チェックリストの作成に失敗しました");
      }

      // 作成したチェックリストのIDを取得
      const checklistData = await checklistResponse.json();
      const checklistId = checklistData.id;

      await Promise.all(
        items.map(async (item) => {
          const res = await fetch(`/api/checklists/${checklistId}/items`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token || "",
            },
            // bodyはJSON形式でサーバーに送信したいデータを指定（リクエストボディ）
            body: JSON.stringify({
              name: item.name,
              quantity: item.quantity ? parseInt(item.quantity) : null,
              unit: item.unit,
              categoryId: item.categoryId,
              status: "NotStarted", // 初期ステータスは未完了
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
    <ChecklistForm
      formData={formData}
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
      isEdit={false}
    />

  );
};

export default NewChecklistPage;
