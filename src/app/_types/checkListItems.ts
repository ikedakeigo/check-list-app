export enum ChecklistStatus {
  NotStarted = "NotStarted",
  Pending = "Pending",
  Completed = "Completed",
}

export type CheckListItemsRequestBody = {
  name: string;
  description?: string;
  categoryId: number;
  quantity?: number;
  unit?: string;
  memo?: string;
  status?: ChecklistStatus; // Prisma のデフォルト値（NotStarted）を使用
};

export type TodaysCheckList = {
  id: number;
  name: string;
  siteName: string;
  workDate: string;
  completedItems: number;
  totalItems: number;
}[];

export type RecentCheckList = {
  id: number;
  name: string;
  createdAt: string;
  siteName: string;
  status: ChecklistStatus;
  isTemplate: boolean;
  archivedAt: string | null;
}[];

/**
 * Partial<T>を使用してコードの省略
 */
export type UpdateCheckListItems = Partial<CheckListItemsRequestBody> & {
  status: ChecklistStatus;
};

export type UpdateCheckListItemStatus = {
  status: ChecklistStatus;
};

export type NewItem = {
  id?: number; // オプション: 新規追加時は未定義
  name: string;
  quantity: string;
  unit: string;
  categoryId: number | null;
  categoryName: string;
  status: ChecklistStatus;
  memo?: string;
};

export type GroupedItemsType = {
  [categoryName: string]: CheckListItem[];
};

export type Grouped = Record<string, CheckListItem[]>;

export type UpdateCheckListItemsStatusRequest = {
  status: "Completed" | "Pending";
  itemIds: number[];
};

export type ItemsRes = {
  id: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  categoryId: number;
  category: {
    id: number;
    name: string;
  };
  status: ChecklistStatus;
}[];


// todo 修正が必要

// カテゴリー型
export type Category = {
  id: number;
  name: string;
  description: string | null;
  displayOrder: number;
  createdAt: string; // ISO文字列形式
  updatedAt: string;
};

// チェックリストアイテム型（1件分）
export type CheckListItem = {
  id: number;
  checkListId: number;
  categoryId: number;
  name: string;
  description: string | null;
  unit: string;
  quantity: number;
  status: "NotStarted" | "Pending" | "Completed"; // 状態が決まっていればUnion型にする
  completedAt: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  category: Category;
};

// チェックリストアイテムの配列型
export type ItemsData = CheckListItem[];
