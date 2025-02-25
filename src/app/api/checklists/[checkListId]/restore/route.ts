import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// アーカイブされたチェックリストを復元する
export const POST = async (
  req: NextRequest,
  { params }: { params: { checkListId: string } }
) => {
  // フロントエンドから送られてきたtokenより
  // ログインされたユーザーか判断する
  const token = req.headers.get('Authorization') ?? ''
  // supabaseに対してtokenを送る
  const { error,data } = await supabase.auth.getUser(token)

  // 送ったtokenが正しくない場合、errorが返却されるのでクライアントにもエラーを返す
  if( error ) {
    return NextResponse.json(
      { status: error.message},
      { status: 400 }
    )
  }

  /**
   * アーカイブされたチェックリストを検索
   * where: { archivedAt: { not: null } }
   * アクティブなチェックリストを検索
   * where: { archivedAt: null }
   *
   * 復元する時は、archivedAtをnullに設定する
   */

  if (error || !data.user ) {
    throw new Error('ユーザーは登録されていません。')
  }

  const supabaseUserId = data.user.id

  try {
    const checkList = await prisma.checkLists.update({
      where: {
        id: parseInt(params.checkListId),
        supabaseUserId
      },
      data: {
        archivedAt: null,
      }
    })

    return NextResponse.json(checkList, { status: 200 })
  } catch (error) {
    console.error('Error', error)
    return NextResponse.json(
      { error: 'Error restoring checklist' },
      { status: 500 }
    )
  }
}
