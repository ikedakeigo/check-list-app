import { ChecklistStatus } from "./checkListItems";

export type CheckListRequestBody = {
  name: string;
  description?: string;
  workDate: Date;
  siteName: string;
  isTemplate: boolean;
  status: ChecklistStatus;
  completedAt?: Date | null;
}


export type ChecklistFormData = {
  name: string;
  description?: string;
  siteName: string;
  workDate: Date;
  isTemplate: boolean;
}
