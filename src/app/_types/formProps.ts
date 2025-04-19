import { AddCategory } from "@/app/_types/category";
import { CheckLists } from "@prisma/client";
import { ChecklistFormData } from "@/app/_types/checklists";
import { NewItem } from "@/app/_types/checkListItems";
import { SubmitHandler } from "react-hook-form";

export type formProps = {
  formData?: ChecklistFormData;
  categories: AddCategory;
  setCategories: React.Dispatch<React.SetStateAction<AddCategory>>;
  selectedCategoryId: number | null;
  setSelectedCategoryId: (id: number | null) => void;
  items: NewItem[];
  newItem: NewItem;
  setNewItem: React.Dispatch<React.SetStateAction<NewItem>>;
  handleAddItem: () => void;
  onSubmit: SubmitHandler<FormInputs>;
  handleRemoveItem: (index: number) => void;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  success: string | null;
  token: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
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
