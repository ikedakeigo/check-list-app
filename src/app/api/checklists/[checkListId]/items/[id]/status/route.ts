import { UpdateCheckListItemStatus } from "@/app/_types/checkListItems";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// チェックアイテムのステータス更新
export const PATCH = async (
  req: NextRequest,
  { params }: { params: { checkListId: string, id: string } }
) => {
  try {
    const body: UpdateCheckListItemStatus = await req.json();
    const { status } = body;
    const item = await prisma.checkListItem.update({
      where: {
        id: parseInt(params.id),
        checkListId: parseInt(params.checkListId)
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
