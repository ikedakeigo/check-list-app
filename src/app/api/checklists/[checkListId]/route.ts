import { CheckListRequestBody } from "@/app/_types/checklists";
import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// チェックリストの詳細取得
export const GET = async (
  req: NextRequest,
  {params}: { params: { checkListId: string } }
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
    /**
     * パラメータからIDを取得して来ているため、string型でidが渡ってくる
     * そのため、number型に変換してからprismaのfindUniqueメソッドに渡す
     * parseInt()でstring型をnumber型に変換している
    */
   // parseInt()で変換できなかった原因は、ディレクトリー名が[:id]になっていたため
   const id = parseInt(params.checkListId)

   if (isNaN(id)) {
    return NextResponse.json(
      { error: 'Invalid checklist ID' },
      { status: 400  }
    )
   }

    const checkList = await prisma.checkLists.findUnique({
      where: {
        id
      },
      include: {
        items: { // チェックリストに紐づくアイテムを取得
          include: {
            category: true, // アイテムに紐づくカテゴリーを取得
          }
        },
        user: true
      }
    })

    if (!checkList) {
      return NextResponse.json(
        { error: 'Checklist not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(checkList, { status: 200 })

  } catch (error) {
    console.error('Error', error)
    return NextResponse.json(
      { error: 'Error fetching checklist' },
      { status: 500}
    )
  }
}


// チェックリストの更新
export const PATCH = async (
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

  if( error || !data.user) {
    throw new Error('ユーザーは登録されていません。')
  }

  const supabaseUserId = data.user.id

  try {
    const body: CheckListRequestBody = await req.json()
    const { name, description, workDate, siteName, isTemplate } = body

    const checkList = await prisma.checkLists.update({
      where: {
        id: parseInt(params.checkListId),
        user: { supabaseUserId }
      },
      data: {
        name,
        description,
        workDate: workDate ? new Date(workDate) : undefined,
        siteName,
        isTemplate,
      }
    })

    return NextResponse.json(checkList, { status: 200 })

  } catch (error) {
    console.error('Error', error)
    return NextResponse.json(
      { error: 'Error updating checklist' },
      { status: 500 }
    )
  }
}


// チェックリストの削除
export const DELETE = async (
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

  if( error || !data.user) {
    throw new Error('ユーザーは登録されていません。')
  }

  const supabaseUserId = data.user.id

  try {
    await prisma.checkLists.delete({
      where: {
        id: parseInt(params.checkListId),
        user: { supabaseUserId }
      }
    })

    return NextResponse.json(null)
  } catch (error) {
    console.error('Error', error)
    return NextResponse.json(
      { error: 'Error deleting checklist' },
      { status: 500 }
    )
  }
}
