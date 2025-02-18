import { PrismaClient } from "@prisma/client";
// import { NextApiRequest } from "next";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// 通知一覧の取得
export const GET = async () => {
  try {
    const userId = 1 // todo 認証実装後に実装のIDを入れる

    const notifications = await prisma.notification.findMany({
      where: {
        userId
      },
      include: {
        checkList: {
          select: {
            name: true,
            siteName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(notifications, { status: 200 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error'},
      { status: 500 }
    )
  }
}
