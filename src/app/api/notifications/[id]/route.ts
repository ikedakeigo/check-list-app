import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// 通知の削除
export const DELETE = async(
  req: NextRequest,
  { params }: { params: { id: string }}
) => {
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
