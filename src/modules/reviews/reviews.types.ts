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

export const REVIEW_SORTS = ["newest", "highest", "lowest"] as const;
export type TReviewSort = (typeof REVIEW_SORTS)[number];
