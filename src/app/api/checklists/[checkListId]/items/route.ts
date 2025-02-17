import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// チェックリストアイテム一覧の取得
export const GET = async (
  req: NextRequest,
  { params }: { params: { checkListId: string } }
) => {
  try {
    const items = await prisma.checkListItem.findMany({
      where: {
        checkListId: parseInt(params.checkListId)
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(items, { status: 200 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


// チェックリストアイテムの作成
export const POST = async (
  req: NextRequest,
  { params }: { params: { checkListId: string } }
) => {
  try {
    const body = await req.json()
    const { name, description, categoryId, quantity, unit, memo } = body

    const item = await prisma.checkListItem.create({
      data: {
        name,
        description,
        categoryId,
        quantity,
        unit,
        memo,
        checkListId: parseInt(params.checkListId),
        userId: 1 // TODO: 認証実装後に実際のユーザーIDを使用
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(item, { status: 200 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
