import { CheckListItemsRequestBody } from "@/app/_types/checkListItems";
import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// チェックリストアイテム一覧の取得
export const GET = async (req: NextRequest, { params }: { params: { checkListId: string } }) => {
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
    const items = await prisma.checkListItem.findMany({
      where: {
        checkListId: parseInt(params.checkListId),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};

// チェックリストアイテムの作成
export const POST = async (req: NextRequest, { params }: { params: { checkListId: string } }) => {
  // フロントエンドから送られてきたtokenより
  // ログインされたユーザーか判断する
  const token = req.headers.get("Authorization") ?? "";

  // supabaseに対してtokenを送る
  const { data, error } = await supabase.auth.getUser(token);

  // 送ったtokenが正しくない場合、errorが返却されるのでクライアントにもエラーを返す
  if (error) {
    return NextResponse.json({ error: "ユーザー認証に失敗しました" }, { status: 401 });
  }

  try {
    const body: CheckListItemsRequestBody = await req.json();
    const { name, description, categoryId, quantity, unit, memo } = body;

    if (error || !data.user) {
      throw new Error("ユーザーは登録されていません。");
    }

    const supabaseUserId = data.user.id;

    const userData = await prisma.user.findUnique({
      where: { supabaseUserId },
    });

    if(!userData) {
      return NextResponse.json(
        {error: "User not found"},
        {status: 404}
      )
    }

    // チェックリストアイテムを作成
    const item = await prisma.checkListItem.create({
      data: {
        name,
        description,
        categoryId,
        quantity,
        unit,
        memo,
        checkListId: parseInt(params.checkListId),
        userId: userData.id,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating checklist item:", error);
    return NextResponse.json(
      { error: "チェックリストアイテムの作成に失敗しました" },
      { status: 500 }
    );
  }
};
