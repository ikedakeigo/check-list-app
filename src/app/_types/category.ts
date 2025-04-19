export type CategoryRequestBody = {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
}[];

export type UpsertCategoryRequestBody = {
  name: string;
  description?: string;
  displayOrder: number;
}

export type UpdateCategoryOrderRequest = {
  orders: { id: number; displayOrder: number }[];
};

export type AddCategory = {
  id: number;
  name: string;
}[];

export type FeatchCategory = {
  id: number;
  name: string;
  description: string;
  displayOrder: number;
}
