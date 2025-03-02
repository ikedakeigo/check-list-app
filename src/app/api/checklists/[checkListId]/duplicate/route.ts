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
  const { error, data } = await supabase.auth.getUser(token)

  // 送ったtokenが正しくない場合、errorが返却されるのでクライアントにもエラーを返す
  if( error ) {
    return NextResponse.json(
      { status: error.message},
      { status: 400 }
    )
  }

  if (error || !data.user) {
    throw new Error('ユーザーは登録されていません。')
  }

  const supabaseUserId = data.user.id

  try {
    // 元のチェックリストを取得
    const originalChecklist = await prisma.checkLists.findUnique({
      where: {
        id: parseInt(params.checkListId),
        user: { supabaseUserId }
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

    // 新しいチェックリストを作成
    const newChecklist = await prisma.checkLists.create({
      data: {
        name: `${originalChecklist.name}(copy)`,
        description: originalChecklist.description,
        siteName: originalChecklist.siteName,
        workDate: originalChecklist.workDate, // 作業日はそのままコピー
        isTemplate: true, // テンプレートとして作成
        user: {
          connect: { supabaseUserId }
        },
        // アイテムもコピー
        items: {
          create: originalChecklist.items.map(item => ({
            name: item.name,
            description: item.description,
            category: {
              connect: { id: item.categoryId}
            },
            quantity: item.quantity,
            unit: item.unit,
            memo: item.memo,
            user: {
              connect: { supabaseUserId }
            }
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
