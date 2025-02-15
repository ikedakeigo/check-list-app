import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// チェックリストの詳細取得
export const GET = async (
  req: NextRequest,
  {params}: { params: { id: string } }
) => {
  try {
    /**
     * パラメータからIDを取得して来ているため、string型でidが渡ってくる
     * そのため、number型に変換してからprismaのfindUniqueメソッドに渡す
     * parseInt()でstring型をnumber型に変換している
    */
   // parseInt()で変換できなかった原因は、ディレクトリー名が[:id]になっていたため
   const id = parseInt(params.id)

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
        items: {
          include: {
            category: true,
          }
        }
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
  { params }: { params: { id: string } }
) => {
  try {
    const body = await req.json()
    const { name, description, workDate, siteName, isTemplate } = body

    const checkList = await prisma.checkLists.update({
      where: {
        id: parseInt(params.id)
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
    return NextResponse.json(
      { error: 'Error updating checklist' },
      { status: 500 }
    )
  }
}


// チェックリストの削除
export const DELETE = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    await prisma.checkLists.delete({
      where: {
        id: parseInt(params.id)
      }
    })

    return NextResponse.json(null)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error deleting checklist' },
      { status: 500 }
    )
  }
}
