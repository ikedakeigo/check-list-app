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
    // トランザクションを使用して、アイテム更新とチェックリスト更新を一括処理
    const result = await prisma.$transaction(async (tx) => {
      // 所有者をチェックする
      const existingItem = await tx.checkListItem.findFirst({
        where: {
          id: parseInt(params.id),
          checkListId: parseInt(params.checkListId),
          user: { supabaseUserId },
        },
        include: {
          category: true,
        },
      });

      if (!existingItem) {
        throw new Error("対象アイテムが見つからないか、アクセス権がありません。");
      }

      // アイテムのステータスを更新
      const updatedItem = await tx.checkListItem.update({
        where: {
          id: parseInt(params.id),
        },
        data: {
          status,
          completedAt: status === "Completed" ? new Date() : null,
        },
      });

      // チェックリスト内の全アイテムの状況を確認
      const allItems = await tx.checkListItem.findMany({
        where: {
          checkListId: parseInt(params.checkListId),
        },
        select: {
          id: true,
          status: true,
        },
      });

      // チェックリストのステータスを決定
      let checklistStatus: "NotStarted" | "Pending" | "Completed";

      const completedItems = allItems.filter((item) => item.status === "Completed");
      const totalItems = allItems.length;

      if (completedItems.length === 0) {
        // 完了したアイテムがない場合
        checklistStatus = "NotStarted";
      } else if (completedItems.length === totalItems) {
        // すべてのアイテムが完了している場合
        checklistStatus = "Completed";
      } else {
        // 一部のアイテムが完了している場合
        checklistStatus = "Pending";
      }

      // チェックリストのステータスを更新
      const updatedChecklist = await tx.checkLists.update({
        where: {
          id: parseInt(params.checkListId),
          user: { supabaseUserId },
        },
        data: {
          status: checklistStatus,
        },
      });

      return {
        item: { ...updatedItem, category: existingItem.category },
        checklist: updatedChecklist,
        summary: {
          totalItems,
          completedItems: completedItems.length,
          status: checklistStatus,
        },
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error updating item status:", error);

    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // 適切なエラーレスポンスを返す
    if (error instanceof Error && error.message.includes("見つからない")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    // Prismaクライアントの接続を適切に終了
    await prisma.$disconnect();
  }
};
