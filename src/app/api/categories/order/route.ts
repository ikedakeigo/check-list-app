import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// カテゴリの順番を更新
export const PATCH = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { orders  }: { orders: {id: number; displayOrder: number}[] } = body;

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
