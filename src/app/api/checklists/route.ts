import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// チェックリスト一覧の取得
export const GET = async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const isArchived = searchParams.get("isArchived") === "true";
    const isTemplate = searchParams.get("isTemplate") === "true";

    const checklists = await prisma.checkLists.findMany({
      where: {
        isTemplate,
        archivedAt: isArchived ? { not: null } : null,
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
  try {
    const body = await req.json();
    const { name, description, workDate, siteName, isTemplate } = body;

    const checkList = await prisma.checkLists.create({
      data: {
        name,
        description,
        workDate: new Date(workDate),
        siteName,
        isTemplate: isTemplate || false,
        userId: 1, // 仮のユーザーID（後で認証実装時に修正）
        status: "Pending", // デフォルト値だが明示的に指定
      },
    });

    return NextResponse.json(checkList, { status: 200 });
  } catch (error) {
    console.error('Error', error)
    return NextResponse.json({ error: "Error creating checklist" }, { status: 500 });
  }
};
