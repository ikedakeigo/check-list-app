import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * トップページ（ダッシュボード）用のデータを取得するAPI
 * - 今日の現場（workDateが今日のチェックリスト）
 * - 最近のチェックリスト（直近48時間以内に閲覧したトップ5）
 * - 通知
 */
export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const token = req.headers.get("Authorization") ?? "";

  // Supabase 認証チェック
  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: "認証が必要です" },
      { status: 401 }
    );
  }

  const supabaseUserId = authData.user.id;

  try {
    // User テーブルからユーザーIDを取得
    const user = await prisma.user.findUnique({
      where: { supabaseUserId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // 今日の日付範囲を設定（ローカル時間の0:00〜翌日0:00）
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 今日のチェックリストを取得
    const todayChecklists = await prisma.checkLists.findMany({
      where: {
        userId: user.id,
        workDate: {
          gte: today,
          lt: tomorrow,
        },
        archivedAt: null,
      },
      include: {
        items: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        workDate: "asc",
      },
      take: 5,
    });

    // 今日のチェックリストに統計情報を追加
    const todayChecklistsWithStats = todayChecklists.map((checklist) => {
      const totalItems = checklist.items.length;
      const completedItems = checklist.items.filter(
        (item) => item.status === "Completed"
      ).length;

      return {
        id: checklist.id,
        name: checklist.name,
        siteName: checklist.siteName,
        workDate: checklist.workDate.toISOString(),
        status: checklist.status,
        totalItems,
        completedItems,
      };
    });

    // 48時間前の日時を計算
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    // 最近のチェックリストを取得（直近48時間以内に閲覧したもの、閲覧日時の新しい順でトップ5）
    const recentChecklists = await prisma.checkLists.findMany({
      where: {
        userId: user.id,
        archivedAt: null,
        lastViewedAt: {
          gte: fortyEightHoursAgo,
        },
      },
      include: {
        items: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        lastViewedAt: "desc",
      },
      take: 5,
    });

    // 最近のチェックリストに統計情報を追加
    const recentChecklistsWithStats = recentChecklists.map((checklist) => {
      const totalItems = checklist.items.length;
      const completedItems = checklist.items.filter(
        (item) => item.status === "Completed"
      ).length;

      return {
        id: checklist.id,
        name: checklist.name,
        siteName: checklist.siteName,
        createdAt: checklist.createdAt.toISOString(),
        workDate: checklist.workDate.toISOString(),
        status: checklist.status,
        isTemplate: checklist.isTemplate,
        archivedAt: checklist.archivedAt,
        totalItems,
        completedItems,
      };
    });

    // 通知を取得
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    // 今日のチェックリストの統計を計算
    let totalTaskCount = 0;
    let completedTaskCount = 0;
    todayChecklistsWithStats.forEach((checklist) => {
      totalTaskCount += checklist.totalItems;
      completedTaskCount += checklist.completedItems;
    });

    return NextResponse.json({
      todayChecklists: todayChecklistsWithStats,
      recentChecklists: recentChecklistsWithStats,
      notifications,
      stats: {
        todayCount: todayChecklistsWithStats.length,
        totalTaskCount,
        completedTaskCount,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "ダッシュボードデータの取得に失敗しました" },
      { status: 500 }
    );
  }
};
