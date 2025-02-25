import { UpdateCheckListItems } from "@/app/_types/checkListItems";
import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// チェックリストのアイテム更新
export const PATCH = async (
  req: NextRequest,
  { params }: { params: { checkListId: string; id: string } }
) => {

  // フロントエンドから送られてきたtokenより
  // ログインされたユーザーか判断する
  const token = req.headers.get('Authorization') ?? ''
  // supabaseに対してtokenを送る
  const { error, data } = await supabase.auth.getUser(token)

  // 送ったtokenが正しくない場合、errorが返却されるのでクライアントにもエラーを返す
  if( error ) {
    return NextResponse.json(
      { status: error.message},
      { status: 400 }
    )
  }

  if ( error || !data.user ) {
    throw new Error('ユーザーは登録されていません。')
  }

  const supabaseUserId = data.user.id

  try {
    const body: UpdateCheckListItems = await req.json();
    const { name, description, categoryId, quantity, unit, memo, status } = body;

    const item = await prisma.checkListItem.update({
      where: {
        id: parseInt(params.id),
        checkListId: parseInt(params.checkListId),
        supabaseUserId
      },
      data: {
        name,
        description,
        categoryId,
        quantity,
        unit,
        memo,
        status,
        completedAt: status === 'Completed' ? new Date() : null
      },
      include: {
        category: true // アイテムに関連するカテゴリー情報も取得
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

// チェックリストアイテムの削除
export const DELETE = async (
  req: NextRequest,
  { params }: { params: { checkListId: string; id: string } }
) => {

  // フロントエンドから送られてきたtokenより
  // ログインされたユーザーか判断する
  const token = req.headers.get('Authorization') ?? ''
  // supabaseに対してtokenを送る
  const { error, data } = await supabase.auth.getUser(token)

  // 送ったtokenが正しくない場合、errorが返却されるのでクライアントにもエラーを返す
  if( error ) {
    return NextResponse.json(
      { status: error.message},
      { status: 400 }
    )
  }

  if (error || !data.user ) {
    throw new Error('ユーザーは登録されていません。')
  }

  const supabaseUserId = data.user.id

  try {
    await prisma.checkListItem.delete({
      where: {
        id: parseInt(params.id),
        checkListId: parseInt(params.checkListId),
        supabaseUserId
      }
    })

    return NextResponse.json(null, { status: 200 })
  } catch (error) {
    console.error('Error:' , error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
