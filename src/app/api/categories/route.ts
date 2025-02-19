import { CategoryRequestBody } from "@/app/_types/category";
import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// カテゴリー一覧取得
export const GET = async (
  req: NextRequest
) => {
  // フロントエンドから送られてきたtokenより
  // ログインされたユーザーか判断する
  const token = req.headers.get('Authorization') ?? ''

  // supabaseに対してtokenを送る
  const { error } = await supabase.auth.getUser(token)

  // 送ったtokenが正しくない場合、errorが返却されるのでクライアントにもエラーを返す
  if( error ) {
    return NextResponse.json(
      { status: error.message},
      { status: 400 }
    )
  }

  // tokenが正しいものたら以降の処理が走る
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

  const token = req.headers.get('Authorization') ?? ''

  const { error } = await supabase.auth.getUser(token)

  if(error) {
    return NextResponse.json(
      { status: error.message},
      { status: 400 }
    )
  }
  
  try {
    const body: CategoryRequestBody = await req.json()
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
