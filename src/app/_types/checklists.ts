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
