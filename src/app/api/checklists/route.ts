import { CheckListRequestBody } from "@/app/_types/checklists";
import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// チェックリスト一覧の取得
export const GET = async (req: NextRequest) => {

  const token = req.headers.get('Authorization') ?? ''
  const { error } = await supabase.auth.getUser(token)

  if(error) {
    return NextResponse.json(
      { status: error.message},
      { status: 400 }
    )
  }

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

  const token = req.headers.get('Authorization') ?? ''
  const { error } = await supabase.auth.getUser(token)

  if(error) {
    return NextResponse.json(
      { status: error.message},
      { status: 400 }
    )
  }

  try {
    const body: CheckListRequestBody = await req.json();
    const { name, description, workDate, siteName, isTemplate } = body;

    const { data, error }  = await supabase.auth.getUser(token)

    if( error || !data.user) {
      throw new Error('ユーザーは登録されていません。')
    }

    const supabaseUserId = data.user.id

    // let user = await prisma.user.findUnique({
    //   where: {supabaseUserId }
    // })

    // if (!user) {
    //   user = await prisma.user.create({
    //     data: {
    //       supabaseUserId,
    //       role: "user",
    //       name: "aaaaaaaaaaa"
    //     }
    //   })
    // }

    const checkList = await prisma.checkLists.create({
      data: {
        name,
        description,
        workDate: new Date(workDate),
        siteName,
        isTemplate: isTemplate || false,
        user: {
          connect: { supabaseUserId }
        }, //supabaseUserId を持つUserを参照してuserIdを設定,
        status: "Pending", // デフォルト値だが明示的に指定
      },
    });

    return NextResponse.json(checkList, { status: 200 });
  } catch (error) {
    console.error('Error', error)
    return NextResponse.json({ error: "Error creating checklist" }, { status: 500 });
  }
};
