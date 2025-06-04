import { UpdateChecklistRequest } from "@/app/_types/checklists";
import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// チェックリストの詳細取得
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
    /**
     * パラメータからIDを取得して来ているため、string型でidが渡ってくる
     * そのため、number型に変換してからprismaのfindUniqueメソッドに渡す
     * parseInt()でstring型をnumber型に変換している
     */
    // parseInt()で変換できなかった原因は、ディレクトリー名が[:id]になっていたため
    const id = parseInt(params.checkListId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid checklist ID" }, { status: 400 });
    }

    const checkList = await prisma.checkLists.findUnique({
      where: {
        id,
      },
      include: {
        items: {
          // チェックリストに紐づくアイテムを取得
          include: {
            category: true, // アイテムに紐づくカテゴリーを取得
          },
        },
        user: true,
      },
    });

    if (!checkList) {
      return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
    }

    return NextResponse.json(checkList, { status: 200 });
  } catch (error) {
    console.error("Error", error);
    return NextResponse.json({ error: "Error fetching checklist" }, { status: 500 });
  }
};

// チェックリストの更新
export const PATCH = async (req: NextRequest, { params }: { params: { checkListId: string } }) => {
  const token = req.headers.get("Authorization") ?? "";
  const { error, data } = await supabase.auth.getUser(token);

  if (error) {
    return NextResponse.json({ status: error.message }, { status: 400 });
  }

  if (error || !data.user) {
    throw new Error("ユーザーは登録されていません。");
  }

  const supabaseUserId = data.user.id;

  // Prisma User テーブルから実際のユーザーIDを取得
  const user = await prisma.user.findUnique({
    where: { supabaseUserId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  const userId = user.id;

  try {
    const body: UpdateChecklistRequest = await req.json();

    const updatedChecklist = await prisma.$transaction(async (tx) => {
      // チェックリスト基本情報の更新
      const checkList = await tx.checkLists.update({
        where: {
          id: Number(params.checkListId),
          user: { supabaseUserId },
        },
        data: {
          name: body.name,
          description: body.description,
          workDate: body.workDate ? new Date(body.workDate) : undefined,
          siteName: body.siteName,
          isTemplate: body.isTemplate,
          status: body.status,
        },
      });

      // アイテムの処理は items が明示的に送信された場合のみ実行
      if (body.items !== undefined) {
        console.log("アイテム更新処理開始");

        const existingItemIds = (
          await tx.checkListItem.findMany({
            where: { checkListId: checkList.id },
            select: { id: true },
          })
        ).map((item) => item.id);

        const items = body.items;

        if (!Array.isArray(items)) {
          throw new Error("Items must be an array");
        }

        const incomingItemIds = items
          .filter((item) => item.id !== undefined)
          .map((item) => item.id);

        // 削除対象（既存アイテムで、リクエストに含まれないもの）
        const toDelete = existingItemIds.filter((id) => !incomingItemIds.includes(id));
        if (toDelete.length > 0) {
          console.log("削除対象アイテム:", toDelete);
          await tx.checkListItem.deleteMany({
            where: {
              id: { in: toDelete },
            },
          });
        }

        // 新規追加または更新
        for (const item of items) {
          // バリデーション: 必須フィールドのチェック
          if (!item.name || !item.name.trim()) {
            throw new Error("アイテム名は必須です");
          }

          if (!item.categoryId) {
            throw new Error("カテゴリーは必須です");
          }

          if (item.id) {
            // 更新
            console.log("アイテム更新:", item.id);
            await tx.checkListItem.update({
              where: { id: item.id },
              data: {
                name: item.name,
                status: item.status,
                quantity: item.quantity,
                unit: item.unit,
                categoryId: item.categoryId,
                memo: item.memo,
              },
            });
          } else {
            // 新規追加
            console.log("アイテム新規追加:", item.name);
            await tx.checkListItem.create({
              data: {
                name: item.name,
                status: item.status,
                quantity: item.quantity,
                unit: item.unit || "",
                memo: item.memo || null,
                checkListId: checkList.id,
                categoryId: item.categoryId,
                userId: userId,
              },
            });
          }
        }
      }

      return checkList;
    });

    return NextResponse.json(updatedChecklist, { status: 200 });
  } catch (error) {
    console.error("Error", error);
    return NextResponse.json({ error: "Error updating checklist" }, { status: 500 });
  }
};

// チェックリストの削除
export const DELETE = async (req: NextRequest, { params }: { params: { checkListId: string } }) => {
  // フロントエンドから送られてきたtokenより
  // ログインされたユーザーか判断する
  const token = req.headers.get("Authorization") ?? "";
  // supabaseに対してtokenを送る
  const { error, data } = await supabase.auth.getUser(token);

  // 送ったtokenが正しくない場合、errorが返却されるのでクライアントにもエラーを返す
  if (error) {
    return NextResponse.json({ status: error.message }, { status: 400 });
  }

  if (error || !data.user) {
    throw new Error("ユーザーは登録されていません。");
  }

  const supabaseUserId = data.user.id;

  try {

    // これだと親をテーブルのみ削除しようとしてしまうので
    // まずは子テーブルのアイテムを削除してから親を削除する
    // チェックリストに紐づくアイテムを削除
    // await prisma.checkLists.delete({
    //   where: {
    //     id: parseInt(params.checkListId),
    //     user: { supabaseUserId }
    //   }
    // })

    // チェックリストが存在するか確認
    // まずはチェックリストが存在するか確認
    const checklist = await prisma.checkLists.findFirst({
      where: {
        id: parseInt(params.checkListId),
        user: { supabaseUserId },
      },
    });

    // チェックリストが存在しない場合、エラーを返す
    if (!checklist) {
      return NextResponse.json(
        { error: "チェックリストが見つからないか、アクセス権限がありません" },
        { status: 404 }
      );
    }

    // 親テーブルの存在を確認したので
    // 先に紐付くアイテムを削除する
    await prisma.checkListItem.deleteMany({
      where: {
        checkListId: parseInt(params.checkListId),
      },
    });

    // アイテムが削除できれば
    // チェックリストを削除する
    await prisma.checkLists.delete({
      where: {
        id: parseInt(params.checkListId),
      },
    });

    return NextResponse.json(null);
  } catch (error) {
    console.error("Error", error);
    return NextResponse.json({ error: "Error deleting checklist" }, { status: 500 });
  }
};
