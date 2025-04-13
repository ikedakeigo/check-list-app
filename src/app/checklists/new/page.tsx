"use client";

import useAuthCheck from "@/app/_hooks/useAuthCheck";
import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import { AddCategory, CategoryRequestBody } from "@/app/_types/category";
import { NewItem } from "@/app/_types/checkListItems";
import { FormInputs } from "@/app/_types/formProps";
import ChecklistForm from "@/components/form/ChecklistForm";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

const NewChecklistPage = () => {
  const router = useRouter();
  const useAuth = useAuthCheck();

  const { id } = useParams();

  const { token } = useSupabaseSession();

  // const [formData, setFormData] = useState({
  //   name: "",
  //   description: "",
  //   siteName: "",
  //   workDate: new Date().toISOString().split("T")[0], // 今日の日付
  //   isTemplate: false,
  // });

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
  const onSubmit = async (data: FormInputs) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

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
            name: data.name,
            description: data.description,
            workDate: data.workDate,
            siteName: data.siteName,
            isTemplate: data.isTemplate,
          }),
        });

        console.log("チェックリストの更新レスポンス", checklistResponse);

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
            name: data.name,
            description: data.description,
            workDate: data.workDate,
            siteName: data.siteName,
            isTemplate: data.isTemplate,
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
