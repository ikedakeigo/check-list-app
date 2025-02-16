import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();
// チェックリストの複製（テンプレート作成）
export const POST = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // 元のチェックリストを取得
    const originalChecklist = await prisma.checkLists.findUnique({
      where: {
        id: parseInt(params.id),
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
        userId: 1, // 仮のユーザーID（後で認証実装時に修正）
        // アイテムもコピー
        items: {
          create: originalChecklist.items.map(item => ({
            name: item.name,
            description: item.description,
            categoryId: item.categoryId,
            quantity: item.quantity,
            unit: item.unit,
            memo: item.memo,
            userId: 1 // TODO: 認証実装後に実際のユーザーIDを使用
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
