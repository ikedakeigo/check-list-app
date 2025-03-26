export enum ChecklistStatus {
  Pending = "Pending",
  Completed = "Completed"
}

export type CheckListItemsRequestBody = {
  name: string;
  description?: string;
  categoryId: number;
  quantity?: number;
  unit?: string;
  memo?: string;
  status: ChecklistStatus;
}

export type TodaysCheckList = {
  id: number;
  name: string;
  siteName: string;
  workDate: string;
  completedItems: number;
  totalItems: number;
}[]

export type RecentCheckList = {
  id: number;
  name: string;
  createdAt: string;
  siteName: string;
  status: ChecklistStatus;
}[]

// export type UpdateCheckListItems = {
//   name: string;
//   description?: string;
//   categoryId: number;
//   quantity?: number;
//   unit?: string;
//   memo?: string;
//   status: ChecklistStatus;
// }

/**
 * Partial<T>を使用してコードの省略
 */
export type UpdateCheckListItems = Partial<CheckListItemsRequestBody> & {
  status: ChecklistStatus
}

export type UpdateCheckListItemStatus = {
  status: ChecklistStatus
}


export type NewItem = {
  name: string;
  quantity: string;
  unit: string;
  categoryId: number | null;
  categoryName: string;
}
