import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// アーカイブされたチェックリストを復元する
export const POST = async (
  req: NextRequest,
  { params }: { params: { checkListId: string } }
) => {
  /**
   * アーカイブされたチェックリストを検索
   * where: { archivedAt: { not: null } }
   * アクティブなチェックリストを検索
   * where: { archivedAt: null }
   *
   * 復元する時は、archivedAtをnullに設定する
   */
  try {
    const checkList = await prisma.checkLists.update({
      where: {
        id: parseInt(params.checkListId),
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
