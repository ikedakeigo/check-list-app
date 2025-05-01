import {  UpsertCategoryRequestBody } from "@/app/_types/category";
import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export const GET = async (_req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const category = await prisma.categories.findUnique({
      where: {
        id: parseInt(params.id),
      },
    });

    if (!category) {
      return NextResponse.json({ error: "カテゴリーが見つかりません" }, { status: 404 });
    }

    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.error("GET Error", error);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
};


// カテゴリー更新
export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) => {
  const token = req.headers.get("Authorization") ?? "";

  const { error } = await supabase.auth.getUser(token);

  if (error) {
    return NextResponse.json({ status: error.message }, { status: 400 });
  }

  try {
    const body: UpsertCategoryRequestBody = await req.json();
    const { name, description, displayOrder } = body;

    // カテゴリー名が重複していないかチェック
    const existingCategory = await prisma.categories.findFirst({
      where: {
        name,
        NOT: {
          id: parseInt(params.id),
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json({ error: "同じ名前のカテゴリーが既に存在します" }, { status: 400 });
    }

    const category = await prisma.categories.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        name,
        description,
        displayOrder,
      },
    });

    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.error("Error", error);
    return NextResponse.json({ error: "Error updating category" }, { status: 500 });
  }
};

// カテゴリー削除
export const DELETE = async (req: NextRequest, { params }: { params: { id: string } }) => {
  // フロントエンドから送られてきたtokenより
  // ログインされたユーザーか判断する
  const token = req.headers.get("Authorization") ?? "";

  // supabaseに対してtokenを送る
  const { error } = await supabase.auth.getUser(token);

  // 送ったtokenが正しくない場合、errorが返却されるのでクライアントにもエラーを返す
  if (error) {
    return NextResponse.json({ status: error.message }, { status: 400 });
  }

  try {
    await prisma.categories.delete({
      where: {
        id: parseInt(params.id),
      },
    });

    return NextResponse.json(null, { status: 200 });
  } catch (error) {
    console.error("Error", error);
    return NextResponse.json({ error: "Error deleting category" }, { status: 500 });
  }
};
