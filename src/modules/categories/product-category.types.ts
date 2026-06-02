export type TCreateCategory = {
  name: string;
  slug: string;
  excerpt?: string | null;
  image: string;
  storageKey: string;
  altText: string;
  parentId?: string | null;
  isActive?: boolean;
};

export type TUpdateCategory = {
  name?: string;
  slug?: string;
  excerpt?: string | null;
  image?: string;
  storageKey?: string;
  altText?: string;
  parentId?: string | null;
  isActive?: boolean;
};
