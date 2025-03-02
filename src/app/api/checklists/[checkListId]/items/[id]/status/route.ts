import { UpdateCheckListItemStatus } from "@/app/_types/checkListItems";
import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// チェックアイテムのステータス更新
export const PATCH = async (
  req: NextRequest,
  { params }: { params: { checkListId: string, id: string } }
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
    const body: UpdateCheckListItemStatus = await req.json();
    const { status } = body;

    /**
     * prismaではネストされたオブジェクトを直接指定することができない
     * updateの代わりにupdateManyを採用
     * userオブジェクトのsupabaseUserIdを参照することができる
     */
    const item = await prisma.checkListItem.updateMany({
      where: {
        id: parseInt(params.id),
        checkListId: parseInt(params.checkListId),
        user: { supabaseUserId }
      },
      data: {
        status,
        completedAt: status === 'Completed' ? new Date() : null
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
