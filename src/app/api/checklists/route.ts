import { CheckListRequestBody } from "@/app/_types/checklists";
import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * チェックリスト一覧の取得 API
 *
 * @description
 * チェックリストを様々な条件でフィルタリング・ソートして取得するAPIエンドポイント。
 * クエリパラメータを使用して、ステータス、日付範囲、テンプレート、アーカイブなどの
 * 条件を指定できる。
 *
 * @queryParams
 * - isArchived: boolean - アーカイブ済みのチェックリストのみ取得（true の場合）
 * - isTemplate: boolean - テンプレートのチェックリストのみ取得（true の場合）
 * - searchQuery: string - 名前または現場名で部分一致検索（大文字小文字区別なし）
 * - status: "Pending" | "Completed" | "NotStarted" - ステータスでフィルタリング
 * - dateFrom: string (YYYY-MM-DD) - 作業日の開始日（この日以降）
 * - dateTo: string (YYYY-MM-DD) - 作業日の終了日（この日以前）
 * - sortBy: "createdAt" | "updatedAt" | "workDate" - ソート対象フィールド（デフォルト: createdAt）
 * - sortOrder: "asc" | "desc" - ソート順（デフォルト: desc = 降順）
 *
 * @returns チェックリスト配列（completedItems, totalItems を含む）
 */
export const GET = async (req: NextRequest) => {
  try {
    // ========================================
    // 1. クエリパラメータの取得と解析
    // ========================================
    const searchParams = req.nextUrl.searchParams;

    // アーカイブフィルター: "true" の場合、アーカイブ済みのチェックリストのみ取得
    const isArchived = searchParams.get("isArchived") === "true";

    // テキスト検索クエリ: 名前または現場名で部分一致検索に使用
    const searchQuery = searchParams.get("searchQuery") || "";

    // ステータスフィルター: Pending（進行中）, Completed（完了）, NotStarted（未着手）
    const status = searchParams.get("status");

    // 日付範囲フィルター: 作業日（workDate）の範囲を指定
    const dateFrom = searchParams.get("dateFrom"); // 開始日
    const dateTo = searchParams.get("dateTo");     // 終了日

    // ソート設定: どのフィールドで、どの順序でソートするか
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // ========================================
    // 2. ソートパラメータのバリデーション
    // ========================================
    // セキュリティ対策: 不正なフィールド名を防ぐため、許可されたフィールドのみ使用
    const validSortFields = ["createdAt", "updatedAt", "workDate"];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    // ソート順は "asc" か "desc" のみ許可
    const safeSortOrder = sortOrder === "asc" ? "asc" : "desc";

    // ========================================
    // 3. 日付フィルター条件の構築
    // ========================================
    // Prismaの where 条件で使用する日付範囲オブジェクト
    const workDateFilter: { gte?: Date; lte?: Date } = {};

    if (dateFrom) {
      // 開始日: 指定日の0:00:00以降
      workDateFilter.gte = new Date(dateFrom);
    }

    if (dateTo) {
      // 終了日: 指定日の23:59:59まで含めるため、翌日の0:00:00未満とする
      // 例: dateTo = "2025-01-09" → 2025-01-10 00:00:00 未満 = 2025-01-09 23:59:59 まで
      const dateToEnd = new Date(dateTo);
      dateToEnd.setDate(dateToEnd.getDate() + 1);
      workDateFilter.lte = dateToEnd;
    }

    // ========================================
    // 4. Prismaクエリの実行
    // ========================================
    const checklists = await prisma.checkLists.findMany({
      where: {
        // テンプレートフィルター: 明示的に "true" が指定された場合のみ適用
        // スプレッド構文で条件付きオブジェクト展開
        ...(searchParams.get("isTemplate") === "true" ? { isTemplate: true } : {}),

        // アーカイブフィルター:
        // - isArchived = true → archivedAt が null でないもの（アーカイブ済み）
        // - isArchived = false → archivedAt が null のもの（アクティブ）
        archivedAt: isArchived ? { not: null } : null,

        // ステータスフィルター: status パラメータが指定された場合のみ適用
        ...(status && { status: status as "Pending" | "Completed" | "NotStarted" }),

        // 日付範囲フィルター: workDateFilter にプロパティがある場合のみ適用
        ...(Object.keys(workDateFilter).length > 0 && { workDate: workDateFilter }),

        // テキスト検索: name または siteName に検索クエリを含むものを取得
        // mode: "insensitive" で大文字小文字を区別しない
        OR: searchQuery
          ? [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { siteName: { contains: searchQuery, mode: "insensitive" } },
            ]
          : undefined,
      },
      // 関連データの取得設定
      include: {
        // チェックリストに紐づくアイテム情報（完了数計算用）
        items: {
          select: {
            id: true,
            status: true, // 完了・未完了の判定に使用
          }
        },
        // アイテムの総数を取得（Prisma の _count 機能）
        _count: {
          select: {
            items: true,
          }
        },
      },
      // ソート設定: 動的フィールド名を使用
      orderBy: {
        [safeSortBy]: safeSortOrder,
      },
    });

    // ========================================
    // 5. レスポンスデータの整形
    // ========================================
    // 各チェックリストに completedItems と totalItems を追加
    const checklistsWithItemCounts = checklists.map(checklist => {
      // 完了したアイテム数をカウント（status が "Completed" のもの）
      const completedItems = checklist.items.filter(
        item => item.status === "Completed"
      ).length;

      // アイテム合計数（Prisma の _count から取得）
      const totalItems = checklist._count.items;

      return {
        ...checklist,
        completedItems, // 完了アイテム数
        totalItems,     // 総アイテム数
      };
    });

    return NextResponse.json(checklistsWithItemCounts);
  } catch (error) {
    console.error("Error fetching checklists:", error);
    return NextResponse.json(
      { error: "チェックリストの取得に失敗しました" },
      { status: 500 }
    );
  }
};

/**
 * チェックリストの新規作成 API
 *
 * @description
 * 認証済みユーザーが新しいチェックリストを作成するAPIエンドポイント。
 * Supabase認証を使用してユーザーを特定し、Prismaでデータを保存する。
 *
 * @requestBody
 * - name: string - チェックリスト名（必須）
 * - description: string - 説明（任意）
 * - workDate: string - 作業日（必須、ISO形式）
 * - siteName: string - 現場名（必須）
 * - isTemplate: boolean - テンプレートかどうか（任意、デフォルト: false）
 * - status: "Pending" | "Completed" | "NotStarted" - 初期ステータス
 *
 * @returns 作成されたチェックリストオブジェクト
 */
export const POST = async (req: NextRequest) => {
  // ========================================
  // 1. 認証チェック
  // ========================================
  // Authorization ヘッダーからトークンを取得
  const token = req.headers.get("Authorization") ?? "";

  // Supabase でトークンを検証し、ユーザー情報を取得
  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  // 認証エラーまたはユーザー情報がない場合は 401 を返す
  if (authError || !authData.user) {
    return NextResponse.json(
      { error: "認証が必要です" },
      { status: 401 }
    );
  }

  const supabaseUser = authData.user;
  const supabaseUserId = supabaseUser.id;

  try {
    // ========================================
    // 2. リクエストボディの取得
    // ========================================
    const body: CheckListRequestBody = await req.json();
    const { name, description, workDate, siteName, isTemplate, status } = body;

    // ========================================
    // 3. ユーザーの取得または作成
    // ========================================
    // upsert: 存在すれば取得、なければ作成
    // これにより、新規ユーザーでも自動的にUserレコードが作成される
    const user = await prisma.user.upsert({
      where: { supabaseUserId },
      update: {}, // 既存ユーザーは更新しない
      create: {
        supabaseUserId,
        // ユーザー名: メタデータの name、なければ email、それもなければ "Unknown"
        name: supabaseUser.user_metadata?.name || supabaseUser.email || "Unknown",
        role: "user", // デフォルトロール
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // ========================================
    // 4. チェックリストの作成
    // ========================================
    const checkList = await prisma.checkLists.create({
      data: {
        name,
        description,
        workDate: new Date(workDate), // 文字列から Date オブジェクトに変換
        siteName,
        isTemplate: isTemplate || false, // 未指定の場合は false
        status,
        userId: user.id, // Prisma User テーブルの ID（Supabase ID ではない）
      },
    });

    // 201 Created で作成されたチェックリストを返す
    return NextResponse.json(checkList, { status: 201 });
  } catch (error) {
    console.error("Error creating checklist:", error);
    return NextResponse.json(
      { error: "チェックリストの作成に失敗しました" },
      { status: 500 }
    );
  }
};
