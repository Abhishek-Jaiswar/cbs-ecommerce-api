export type TCreateBlogPost = {
  title: string;

  slug: string;

  excerpt?: string | undefined;

  content: string;

  image: string;

  storageKey: string;

  altText: string;

  authorId: string;

  categoryId: string;

  tagIds?: string[] | undefined;

  status?: "DRAFT" | "PUBLISHED" | undefined;

  isFeatured?: boolean | undefined;

  publishedAt?: Date | undefined;
};

export type TUpdateBlogPost = {
  title?: string | undefined;

  slug?: string | undefined;

  excerpt?: string | undefined;

  content?: string | undefined;

  image?: string | undefined;

  storageKey?: string | undefined;

  altText?: string | undefined;

  categoryId?: string | undefined;

  tagIds?: string[] | undefined;

  status?: "DRAFT" | "PUBLISHED" | undefined;

  isFeatured?: boolean | undefined;

  publishedAt?: Date | undefined;
};