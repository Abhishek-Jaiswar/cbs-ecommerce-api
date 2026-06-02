export type TCreateReview = {
  rating: number;
  comment: string;
  userId: string;
  productId: string;
};

export type TUpdateReview = {
  rating?: number;
  comment?: string;
};
