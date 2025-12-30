import {
  CheckListItemsRequestBody,
  ChecklistStatus,
  UpdateCheckListItemsStatusRequest,
} from "@/app/_types/checkListItems";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// checkListId のバリデーション
const parseCheckListId = (id: string): number | null => {
  const parsed = Number(id);
  return Number.isNaN(parsed) ? null : parsed;
};

// status のバリデーション（有効な ChecklistStatus か確認）
const validStatuses = Object.values(ChecklistStatus);
const isValidStatus = (status: unknown): status is ChecklistStatus => {
  return typeof status === "string" && validStatuses.includes(status as ChecklistStatus);
};

// チェックリストアイテム一覧の取得
export const GET = async (req: NextRequest, { params }: { params: { checkListId: string } }) => {
  const checkListId = parseCheckListId(params.checkListId);
  if (checkListId === null) {
    return NextResponse.json({ error: "無効なチェックリストIDです" }, { status: 400 });
  }

  const token = req.headers.get("Authorization") ?? "";
  const { error, data } = await supabase.auth.getUser(token);

  // 認証エラーまたはユーザー情報がない場合（data が null の場合も考慮）
  if (error || !data?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const supabaseUserId = data.user.id;

  try {
    const items = await prisma.checkListItem.findMany({
      where: {
        checkListId,
        // ログインユーザーのチェックリストアイテムのみ取得
        user: { supabaseUserId },
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};

// チェックリストアイテムの作成
export const POST = async (req: NextRequest, { params }: { params: { checkListId: string } }) => {
  const checkListId = parseCheckListId(params.checkListId);
  if (checkListId === null) {
    return NextResponse.json({ error: "無効なチェックリストIDです" }, { status: 400 });
  }

  const token = req.headers.get("Authorization") ?? "";
  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  // 認証エラーまたはユーザー情報がない場合（authData が null の場合も考慮）
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const supabaseUser = authData.user;
  const supabaseUserId = supabaseUser.id;

  try {
    const body: CheckListItemsRequestBody = await req.json();
    const { name, description, categoryId, quantity, unit, memo, status } = body;

    // status が指定されている場合はバリデーション
    if (status !== undefined && !isValidStatus(status)) {
      return NextResponse.json({ error: "無効なステータスです" }, { status: 400 });
    }

    // User を supabaseUserId で検索、なければ作成（upsert）
    // 既存ユーザーの場合は名前を最新の情報に更新
    const userName = supabaseUser.user_metadata?.name || supabaseUser.email || "Unknown";
    const user = await prisma.user.upsert({
      where: { supabaseUserId },
      update: { name: userName },
      create: {
        supabaseUserId,
        name: userName,
        role: "user",
      },
    });

    // チェックリストアイテムを作成（status は指定があればそれを使用、なければ Prisma のデフォルト値）
    const item = await prisma.checkListItem.create({
      data: {
        name,
        description,
        categoryId,
        quantity,
        unit,
        memo,
        checkListId,
        userId: user.id,
        ...(status && { status }), // 検証済みの status を設定
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating checklist item:", error);
    return NextResponse.json(
      { error: "チェックリストアイテムの作成に失敗しました" },
      { status: 500 }
    );
  }
};

// チェックリストアイテムのステータス一括更新
export const PATCH = async (req: NextRequest, { params }: { params: { checkListId: string } }) => {
  const checkListId = parseCheckListId(params.checkListId);
  if (checkListId === null) {
    return NextResponse.json({ error: "無効なチェックリストIDです" }, { status: 400 });
  }

  const token = req.headers.get("Authorization") ?? "";
  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  // 認証エラーまたはユーザー情報がない場合（authData が null の場合も考慮）
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const supabaseUser = authData.user;
  const supabaseUserId = supabaseUser.id;

  try {
    const body: UpdateCheckListItemsStatusRequest = await req.json();
    const { status, itemIds } = body;

    // User を supabaseUserId で検索、なければ作成（upsert）
    // 既存ユーザーの場合は名前を最新の情報に更新
    const userName = supabaseUser.user_metadata?.name || supabaseUser.email || "Unknown";
    const user = await prisma.user.upsert({
      where: { supabaseUserId },
      update: { name: userName },
      create: {
        supabaseUserId,
        name: userName,
        role: "user",
      },
    });

    const updatedItems = await prisma.checkListItem.updateManyAndReturn({
      where: {
        id: { in: itemIds },
        checkListId,
        userId: user.id,
      },
      data: {
        status,
        completedAt: status === "Completed" ? new Date() : null,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updatedItems, { status: 200 });
  } catch (error) {
    console.error("Error updating checklist items:", error);
    return NextResponse.json(
      { error: "チェックリストアイテムの更新に失敗しました" },
      { status: 500 }
    );
  }
};

// チェックリストアイテムの削除
export const DELETE = async (req: NextRequest, { params }: { params: { checkListId: string } }) => {
  const checkListId = parseCheckListId(params.checkListId);
  if (checkListId === null) {
    return NextResponse.json({ error: "無効なチェックリストIDです" }, { status: 400 });
  }

  const token = req.headers.get("Authorization") ?? "";
  const { data, error } = await supabase.auth.getUser(token);

  // 認証エラーまたはユーザー情報がない場合（data が null の場合も考慮）
  if (error || !data?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const supabaseUserId = data.user.id;

  try {
    await prisma.checkListItem.deleteMany({
      where: {
        checkListId,
        user: { supabaseUserId },
      },
    });

    return NextResponse.json({ message: "チェックリストアイテムを削除しました" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting checklist items:", error);
    return NextResponse.json(
      { error: "チェックリストアイテムの削除に失敗しました" },
      { status: 500 }
    );
  }
};
