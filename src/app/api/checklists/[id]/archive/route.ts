import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// チェックリストのアーカイブ
export const POST = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const checkList = await prisma.checkLists.update({
      where: {
        id: parseInt(params.id),
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
