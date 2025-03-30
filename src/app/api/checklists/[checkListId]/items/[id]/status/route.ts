import { UpdateCheckListItemStatus } from "@/app/_types/checkListItems";
import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// チェックアイテムのステータス更新
export const PATCH = async (
  req: NextRequest,
  { params }: { params: { checkListId: string; id: string } }
) => {

  // フロントエンドから送られてきたtokenより
  // ログインされたユーザーか判断する
  const token = req.headers.get("Authorization") ?? "";
  // supabaseに対してtokenを送る
  const { error, data } = await supabase.auth.getUser(token);

  // 送ったtokenが正しくない場合、errorが返却されるのでクライアントにもエラーを返す
  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUserId = data.user.id;
  const body: UpdateCheckListItemStatus = await req.json();
  const { status } = body;

  try {
    // 所有者をチェックする
    const existingItem = await prisma.checkListItem.findFirst({
      where: {
        id: parseInt(params.id),
        checkListId: parseInt(params.checkListId),
        user: { supabaseUserId },
      },
      include: {
        category: true,
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: "対象アイテムが見つからないか、アクセス権がありません。" }, { status: 404 });
    }

    // 更新
    const updatedItem = await prisma.checkListItem.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        status,
        completedAt: status === "Completed" ? new Date() : null,
      },
    })

    return NextResponse.json({ ...updatedItem, category: existingItem.category }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
