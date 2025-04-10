import { UpdateCategoryOrderRequest } from "@/app/_types/category";
import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// カテゴリの順番を更新
export const PATCH = async (req: NextRequest) => {

  // supabaseログイン認可
  const token = req.headers.get('Authorization') ?? ''

  const { error } = await supabase.auth.getUser(token)

  if(error) {
    return NextResponse.json(
      { status: error.message},
      { status: 400 }
    )
  }

  try {
    const body: UpdateCategoryOrderRequest = await req.json();
    const { orders } = body;

    // prisma.$transactionは全てのupdateが成功したらデータベースにコミットする
    await prisma.$transaction(
      orders.map(({ id, displayOrder }) =>
        prisma.categories.update({
          where: { id },
          data: { displayOrder }
        })
      )
    )

    // $transactionで更新したあと、最新のカテゴリーを最新の並び順で取得
    const updatedCategories = await prisma.categories.findMany({
      orderBy: {
        displayOrder: 'asc'
      }
    })

    return NextResponse.json(updatedCategories, { status: 200 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
