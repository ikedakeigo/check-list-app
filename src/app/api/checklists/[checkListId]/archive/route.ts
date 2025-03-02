import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// チェックリストのアーカイブ
export const POST = async (
  req: NextRequest,
  { params }: { params: { checkListId: string } }
) => {

  const token = req.headers.get('Authorization') ?? ''
  const { error, data } = await supabase.auth.getUser(token)

  if(error) {
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
    const checkList = await prisma.checkLists.update({
      where: {
        id: parseInt(params.checkListId),
        user: {supabaseUserId}
      },
      data: {
        archivedAt: new Date(),
      }
    })

    return NextResponse.json(checkList, { status: 200 })
  } catch (error) {
    console.error('Error', error)
    return NextResponse.json(
      { error: 'Error archiving checklist' },
      { status: 500 }
    )
  }
}
