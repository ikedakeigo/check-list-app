import { AddCategory } from "@/app/_types/category";
import { CheckLists } from "@prisma/client";
import { ChecklistFormData } from "@/app/_types/checklists";
import { NewItem } from "@/app/_types/checkListItems";

export type formProps = {
  formData?: ChecklistFormData;
  categories: AddCategory;
  selectedCategoryId: number | null;
  setSelectedCategoryId: (id: number | null) => void;
  items: NewItem[];
  newItem: NewItem;
  setNewItem: React.Dispatch<React.SetStateAction<NewItem>>;
  handleAddItem: () => void;
  onSubmit: (data: FormInputs) => void;
  handleRemoveItem: (index: number) => void;
  loading: boolean;
  error: string | null;
  success: string | null;

  // オプショナルなプロパティ
  isEdit?: boolean;
  checklist?: CheckLists | null;
  id?: string | number;
  setFormData?: React.Dispatch<React.SetStateAction<ChecklistFormData>>;
  handleArchiveChecklist?: () => void;
  handleDeleteChecklist?: () => void;
};

export type FormInputs = {
  name: string;
  description: string;
  siteName: string;
  workDate: string;
  isTemplate: boolean;
  quantity: number;
  unit: string;
  newItem: {
    name: string;
    quantity: number;
    unit: string;
  };
  category: string;
  selectedCategoryId: number | null;
};
