import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// 通知一覧の取得
export const GET = async (req: NextRequest) => {

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

    const { data, error } = await supabase.auth.getUser(token)

    if(error || !data.user) {
      throw new Error('ユーザーは登録されていません。')
    }

    const supabaseUserId = data.user.id

    const notifications = await prisma.notification.findMany({
      where: {
        user: { supabaseUserId }
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

export const POST = async(req: NextRequest) => {

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
    const { data, error } = await supabase.auth.getUser(token)

    if(error || !data.user) {
      throw new Error('ユーザーは登録されていません。')
    }

    const supabaseUserId = data.user.id

    const today = new Date()
    today.setHours(0,0,0,0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 今日の作業予定を取得する
    const todaysCheckLists = await prisma.checkLists.findMany({
      where: {
        workDate: {
          gte: today,
          lt: tomorrow
        },
        archivedAt: null,
        isTemplate: false
      },
      include: {
        items: {
          include: {
            category: true
          }
        }
      }
    })

    // チェックリストごとに通知を作成
    const notifications = await Promise.all(
      todaysCheckLists.map(async (checklist) => {

        // アイテムの必要な情報のみ
        const requiredItems = checklist.items.map(item => ({
          name: item.name,
          category: item.category.name,
          quantity: item.quantity,
          unit: item.unit,
        }))

        // チェックリストごとに通知を作成
        return await prisma.notification.create({
          data: {
            user: {
              connect: { supabaseUserId }
            },
            checkList: {
              connect: { id: checklist.id }
            },
            type: 'DAILY_REMINDER',
            title: `本日の作業: ${checklist.siteName}`,
            message: JSON.stringify({
              siteName: checklist.siteName,
              totalItems: checklist.items.length,
              requiredItems
            })
          }
        })
      })
    )

    return NextResponse.json(
      {
        message: '通知が作成されました',
        notifications
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error creating notifications:', error)
    return NextResponse.json(
      { error: 'Failed to create notifications' },
      { status: 500 }
    )
  }
}
