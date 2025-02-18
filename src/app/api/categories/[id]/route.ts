import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// カテゴリー更新
export const PATCH = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await req.json()
    const { name, description, displayOrder } = body

    // カテゴリー名が重複していないかチェック
    const existingCategory = await prisma.categories.findFirst({
      where:{
        name,
        NOT: {
          id: parseInt(params.id)
        }
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: '同じ名前のカテゴリーが既に存在します' },
        { status: 400 }
      )
    }

    const category = await prisma.categories.update({
      where: {
        id: parseInt(params.id)
      },
      data: {
        name,
        description,
        displayOrder
      }
    })

    return NextResponse.json(category, { status: 200 })
  } catch (error) {
    console.error('Error', error)
    return NextResponse.json(
      { error: 'Error updating category' },
      { status: 500 }
    )
  }
}

// カテゴリー削除
export const DELETE = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    await prisma.categories.delete({
      where: {
        id: parseInt(params.id)
      }
    })

    return NextResponse.json(null, { status: 200 })
  } catch (error) {
    console.error('Error', error)
    return NextResponse.json(
      { error: 'Error deleting category' },
      { status: 500 }
    )
  }
}
