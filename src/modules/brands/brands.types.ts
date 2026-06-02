export type TCreateBrand = {
  name: string;
  image: string;
  storageKey: string;
  altText?: string;
};

export type TUpdateBrandImage = {
  image: string;
  storageKey: string;
};
