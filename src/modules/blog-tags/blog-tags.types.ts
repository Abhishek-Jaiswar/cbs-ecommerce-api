export type TCreateBlogTag = {
  name: string;
  slug: string;
  isActive?: boolean;
};

export type TUpdateBlogTag = {
  name?: string;
  slug?: string;
  isActive?: boolean;
};
