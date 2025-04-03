import { CheckListItem, CheckLists } from "@prisma/client";

export const handleChecklistStatusUpdate = async (
    updatedItems: CheckListItem[],
    checklist: CheckLists | null,
    setChecklist: (checklist: CheckLists) => void,
    token: string,
    checklistId: number
  ) => {

console.log("checklistId", typeof checklistId);
    const allItemsCompleted = updatedItems.every((item) => item.status === "Completed");
    const someItemsPending = updatedItems.some((item) => item.status === "Pending");

    if (allItemsCompleted && checklist?.status !== "Completed") {
      const res = await fetch(`/api/checklists/${checklistId}`, {
        method: "PATCH",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Completed" }),
      });

      if (!res.ok) throw new Error("チェックリストのステータスの更新に失敗しました");

      const updatedChecklist = await res.json();
      setChecklist(updatedChecklist);
      alert("全てのアイテムとチェックリストが完了しました");

    } else if (someItemsPending && checklist?.status === "Completed") {
      const res = await fetch(`/api/checklists/${checklistId}`, {
        method: "PATCH",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Pending" }),
      });

      if (!res.ok) throw new Error("チェックリストのステータスの更新に失敗しました");

      const updatedChecklist = await res.json();
      setChecklist(updatedChecklist);
    }
  };
