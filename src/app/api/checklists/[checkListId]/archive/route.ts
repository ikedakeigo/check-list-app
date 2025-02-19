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
  const { error } = await supabase.auth.getUser(token)

  if(error) {
    return NextResponse.json(
      { status: error.message},
      { status: 400 }
    )
  }


  try {
    const checkList = await prisma.checkLists.update({
      where: {
        id: parseInt(params.checkListId),
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
