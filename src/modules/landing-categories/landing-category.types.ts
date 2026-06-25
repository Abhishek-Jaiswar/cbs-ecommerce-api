export type TCreateLandingCategory = {
  categoryId: string;
  label: string;
  image: string;
  storageKey: string;
  slot: number;
  isActive?: boolean;
};

export type TUpdateLandingCategory = {
  categoryId?: string;
  label?: string;
  image?: string;
  storageKey?: string;
  slot?: number;
  isActive?: boolean;
};
