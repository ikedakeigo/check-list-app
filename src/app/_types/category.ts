export type CategoryRequestBody ={
  name: string;
  description?: string;
  displayOrder: number;
}

export type UpdateCategoryOrderRequest = {
  orders: { id: number; displayOrder: number}[]
}
