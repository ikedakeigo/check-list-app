import { CheckListRequestBody } from "@/app/_types/checklists";
import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// チェックリスト一覧の取得
export const GET = async (req: NextRequest) => {
  try {
    // クエリパラメータの取得
    const searchParams = req.nextUrl.searchParams;
    // isArchived が true の場合はアーカイブ済みのチェックリストを取得
    const isArchived = searchParams.get("isArchived") === "true";
    // isTemplate が true の場合はテンプレートのチェックリストを取得
    const isTemplate = searchParams.get("isTemplate") === "true";
    // searchQuery がある場合は検索クエリを取得
    const searchQuery = searchParams.get("searchQuery") || ""; // 検索クエリ

    // Prismaのクエリ構築
    const checklists = await prisma.checkLists.findMany({
      where: {
        isTemplate,
        archivedAt: isArchived ? { not: null } : null,
        // 検索クエリがある場合は name または siteName に検索クエリを含むものを取得
        OR: searchQuery
          ? [
              // name または siteName に検索クエリを含むものを取得
              { name: { contains: searchQuery, mode: "insensitive" } },
              // mode: "insensitive" で大文字小文字を区別しない
              { siteName: { contains: searchQuery, mode: "insensitive" } },
            ]
          : undefined,
      },
      // アイテム関連の情報を取得
      include: {
        items: {
          /**
           * リレーション先のテーブルのからidとstatusを取得
           * selectのboolean指定は存在することではなく、取得することを示す
           */
          select: {
            id: true,
            status: true,
          }
        },
        // アイテムの数を取得
        _count: {
          select: {
            items: true,
          }
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // アイテム数情報をチェックリストに追加
    const checklistsWithItemCounts = checklists.map(checklist => {
      // 完了したアイテムを取得
      const completedItmes = checklist.items.filter(
        item => item.status === "Completed"
      ).length;

      // アイテム合計数
      const totalItems = checklist._count.items;

      return {
        ...checklist,
        completedItems: completedItmes,
        totalItems,
      };
    })

    return NextResponse.json(checklistsWithItemCounts);
  } catch (error) {
    console.error("Error fetching checklists", error);
    return NextResponse.json({ error: "Error fetching checklists" }, { status: 500 });
  }
};

// チェックリストの作成
export const POST = async (req: NextRequest) => {
  const token = req.headers.get("Authorization") ?? "";

  // Supabase 認証チェック
  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: "認証が必要です" },
      { status: 401 }
    );
  }

  const supabaseUser = authData.user;
  const supabaseUserId = supabaseUser.id;

  try {
    const body: CheckListRequestBody = await req.json();
    const { name, description, workDate, siteName, isTemplate, status } = body;

    // User を supabaseUserId で検索、なければ作成（upsert）
    const user = await prisma.user.upsert({
      where: { supabaseUserId },
      update: {}, // 既存ユーザーは更新しない
      create: {
        supabaseUserId,
        name: supabaseUser.user_metadata?.name || supabaseUser.email || "Unknown",
        role: "user",
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // userId を明示的に指定してチェックリストを作成
    const checkList = await prisma.checkLists.create({
      data: {
        name,
        description,
        workDate: new Date(workDate),
        siteName,
        isTemplate: isTemplate || false,
        status,
        userId: user.id, // 明示的に userId を設定
      },
    });

    return NextResponse.json(checkList, { status: 201 });
  } catch (error) {
    console.error("Error creating checklist:", error);
    return NextResponse.json(
      { error: "チェックリストの作成に失敗しました" },
      { status: 500 }
    );
  }
};
