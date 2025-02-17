import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// カテゴリー一覧取得
export const GET = async (
  req: NextRequest
) => {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: {
        displayOrder: 'asc' // 表示順で昇順
      }
    })

    return NextResponse.json(categories, { status: 200 })
  } catch (error) {
    console.error('Error', error)
    return NextResponse.json(
      { error: 'Error fetching categories' },
      { status: 500 }
    )
  }
}

// カテゴリー作成
export const POST = async (
  req: NextRequest
) => {
  try {
    const body = await req.json()
    const { name, description, displayOrder } = body

    const existingCategory = await prisma.categories.findUnique({
      where: { name }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: '同じ名前のカテゴリーが既に存在します'},
        { status: 400 }
      )
    }

    const category = await prisma.categories.create({
      data: {
        name,
        description,
        displayOrder: displayOrder || 0 // デフォルト値を設定
      }
    })

    return NextResponse.json(category, { status: 200 })
  } catch (error) {
    console.error('Error', error)
    return NextResponse.json(
      { error: 'Error creating category' },
      { status: 500 }
    )
  }
}


