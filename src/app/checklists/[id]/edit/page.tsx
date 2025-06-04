"use client";

import useAuthCheck from "@/app/_hooks/useAuthCheck";
import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import { AddCategory } from "@/app/_types/category";
import { ChecklistStatus, NewItem } from "@/app/_types/checkListItems";
import { FormattedItems, FormInputs } from "@/app/_types/formProps";
import ChecklistForm from "@/components/form/ChecklistForm";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";

const NewChecklistPage = () => {
  const router = useRouter();
  const useAuth = useAuthCheck();

  const { id } = useParams();

  const { token } = useSupabaseSession();

  const methods = useForm<FormInputs>({
    defaultValues: {
      name: "",
      description: "",
      workDate: new Date().toISOString().split("T")[0],
      siteName: "",
      isTemplate: false,
    },
  });


  // カテゴリー関連の状態
  const [categories, setCategories] = useState<AddCategory>([]);

  // 選択中のカテゴリーID
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // アイテムの初期値を関数で定義
  const initialNewItem: NewItem = {
    name: "",
    quantity: Number.isNaN(parseInt("0")) ? "" : "0", // 初期値は空文字列または"0"
    unit: "",
    categoryId: null,
    categoryName: "",
    status: ChecklistStatus.NotStarted,
  };

  // アイテム管理の状態
  const [items, setItems] = useState<NewItem[]>([initialNewItem]);

  // 新しいアイテムの入力状態
  const [newItem, setNewItem] = useState<NewItem>({
    name: "",
    quantity: Number.isNaN(parseInt("0")) ? "" : "0", // 初期値は空文字列または"0"
    unit: "",
    categoryId: null,
    categoryName: "",
    status: ChecklistStatus.NotStarted,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [checklistStatus, setChecklistStatus] = useState<ChecklistStatus>();

  const fetchChecklist = useCallback(async () => {
    if (!token || !useAuth) return;

    try {
      setLoading(true);

      const [checklist, items, categories] = await Promise.all([
        fetch(`/api/checklists/${id}`, {
          headers: { Authorization: token },
        }).then((res) => {
          if (!res.ok) throw new Error("チェックリストの取得に失敗しました");
          return res.json();
        }),
        fetch(`/api/checklists/${id}/items`, {
          headers: { Authorization: token },
        }).then((res) => {
          if (!res.ok) throw new Error("アイテムの取得に失敗しました");
          return res.json();
        }),
        fetch(`/api/categories`, {
          headers: { Authorization: token },
        }).then((res) => {
          if (!res.ok) throw new Error("カテゴリーの取得に失敗しました");
          return res.json();
        }),
      ]);

      setChecklistStatus(checklist.status);

      // フォームの初期値を設定
      methods.reset({
        name: checklist.name,
        description: checklist.description,
        siteName: checklist.siteName,
        workDate: new Date(checklist.workDate).toISOString().split("T")[0],
        isTemplate: checklist.isTemplate,
      });

      // アイテムの初期値を設定
      const formattedItems = items.map((item: FormattedItems) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity ? item.quantity.toString() : "",
        unit: item.unit || "",
        categoryId: item.categoryId,
        categoryName: item.category?.name || "",
        status: item.status,
      }));

      setItems(formattedItems);
      setCategories(categories);
      setSelectedCategoryId(formattedItems[0]?.categoryId || null);
    } catch (err) {
      console.error("初期データの取得に失敗しました", err);
      setError("初期データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [token, useAuth, id, methods]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

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
      status: ChecklistStatus.NotStarted,
    };

    // アイテムリストに追加
    // スプレット構文を使用して新しいアイテムを追加する
    // ...prevには既存のアイテムが入っている
    setItems((prev) => [...prev, item]);

    setError(null);
  };

  // アイテムを削除する関数
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // フォーム送信処理
  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    console.log("送信データ", data.name);

    try {
      if (id) {
        // 編集の場合
        // チェックリスト本体の更新
        const payload = {
          name: data.name,
          description: data.description,
          workDate: data.workDate,
          siteName: data.siteName,
          isTemplate: data.isTemplate,
          status: checklistStatus,
          items: items.map((item) => ({
            id: item.id, // ← 既存アイテムはidがある、新規はundefined
            name: item.name,
            status: item.status,
            quantity: item.quantity ? Number(item.quantity) : null,
            unit: item.unit,
            categoryId: item.categoryId,
            memo: item.memo,
          })),
        };

        const checklistResponse = await fetch(`/api/checklists/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token || "",
          },
          body: JSON.stringify(payload),
        });

        console.log("チェックリストの更新レスポンス", checklistResponse);

        if (!checklistResponse.ok) {
          const errorData = await checklistResponse.json();
          throw new Error(errorData.error || "チェックリストの更新に失敗しました");
        }

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
    <FormProvider {...methods}>
      <ChecklistForm
        // formData={formData}
        categories={categories}
        setCategories={setCategories}
        items={items}
        newItem={newItem}
        setNewItem={setNewItem}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        handleAddItem={handleAddItem}
        handleRemoveItem={handleRemoveItem}
        onSubmit={onSubmit}
        loading={loading}
        setLoading={setLoading}
        error={error}
        success={success}
        isEdit={true}
        token={token}
        setError={setError}
      />
    </FormProvider>
  );
};

export default NewChecklistPage;
