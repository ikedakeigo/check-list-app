import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// 通知の削除
export const DELETE = async(
  req: NextRequest,
  { params }: { params: { id: string }}
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
    await prisma.notification.delete({
      where: {
        id: parseInt(params.id)
      }
    })

    return NextResponse.json(null, { status: 200 })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: 'Internal server error'},
      { status: 500 }
    )
  }
}
