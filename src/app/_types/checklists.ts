import { CheckLists } from "@prisma/client";
import { ChecklistStatus } from "./checkListItems";
export type CheckListRequestBody = {
  name: string;
  description?: string;
  workDate: Date;
  siteName: string;
  isTemplate: boolean;
  status: ChecklistStatus;
  completedAt?: Date | null;
};

export type ChecklistFormData = {
  name: string;
  description?: string;
  siteName: string;
  workDate: string;
  isTemplate: boolean;
};

// 拡張したチェックリスト型
export interface CheckListWithItems extends CheckLists {
  totalItems: number;
  completedItems: number;
}

export type UpdateChecklistRequest = {
  name: string;
  description?: string;
  workDate?: string;
  siteName?: string;
  isTemplate?: boolean;
  status: ChecklistStatus;
  items?: {
    id?: number; // 既存アイテムの場合のみ存在
    name: string;
    status: ChecklistStatus;
    quantity?: number;
    unit?: string;
    categoryId: number; // 必須
    memo?: string;
  }[];
};
