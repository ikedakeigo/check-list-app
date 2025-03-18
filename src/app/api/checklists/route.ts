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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(checklists);
  } catch (error) {
    console.error("Error fetching checklists", error);
    return NextResponse.json({ error: "Error fetching checklists" }, { status: 500 });
  }
};

// チェックリストの作成
export const POST = async (req: NextRequest) => {
  const token = req.headers.get("Authorization") ?? "";
  const { error } = await supabase.auth.getUser(token);

  if (error) {
    return NextResponse.json({ status: error.message }, { status: 400 });
  }

  try {
    const body: CheckListRequestBody = await req.json();
    const { name, description, workDate, siteName, isTemplate } = body;

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new Error("ユーザーは登録されていません。");
    }

    const supabaseUserId = data.user.id;

    const checkList = await prisma.checkLists.create({
      data: {
        name,
        description,
        workDate: new Date(workDate),
        siteName,
        isTemplate: isTemplate || false,
        user: {
          connect: { supabaseUserId },
        }, //supabaseUserId を持つUserを参照してuserIdを設定,
        status: "Pending", // デフォルト値だが明示的に指定
      },
    });

    return NextResponse.json(checkList, { status: 200 });
  } catch (error) {
    console.error("Error", error);
    return NextResponse.json({ error: "Error creating checklist" }, { status: 500 });
  }
};
