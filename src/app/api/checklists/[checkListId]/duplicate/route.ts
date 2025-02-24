import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();
// チェックリストの複製（テンプレート作成）
export const POST = async (
  req: NextRequest,
  { params }: { params: { checkListId: string } }
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

  try {
    // 元のチェックリストを取得
    const originalChecklist = await prisma.checkLists.findUnique({
      where: {
        id: parseInt(params.checkListId),
      },
      include: {
        items: true,
      }
    })

    if (!originalChecklist) {
      return NextResponse.json(
        { error: 'Checklist not found' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user){
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

    // 新しいチェックリストを作成
    const newChecklist = await prisma.checkLists.create({
      data: {
        name: `${originalChecklist.name}(copy)`,
        description: originalChecklist.description,
        siteName: originalChecklist.siteName,
        workDate: originalChecklist.workDate, // 作業日はそのままコピー
        isTemplate: true, // テンプレートとして作成
        supabaseUserId, // 仮のユーザーID（後で認証実装時に修正）
        // アイテムもコピー
        items: {
          create: originalChecklist.items.map(item => ({
            name: item.name,
            description: item.description,
            categoryId: item.categoryId,
            quantity: item.quantity,
            unit: item.unit,
            memo: item.memo,
            supabaseUserId // TODO: 認証実装後に実際のユーザーIDを使用
          }))
        },
      },
      include: {
        items: true
      }
    })

    return NextResponse.json(newChecklist, { status: 200 })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
