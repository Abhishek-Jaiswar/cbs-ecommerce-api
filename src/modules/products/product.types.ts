export type TMediaDTO = {
  url: string;
  storageKey: string;
  altText?: string;
};

export type TCreateProductImages = {
  productId: string;
  mediaId: string;
  colorId: string;
  position: number;
  isPrimary: boolean;
};

export type TCreateProductSpecification = {
  id: string;
  key: string;
  value: string;
};

export type TProductImageUpload = {
  media: TMediaDTO;
  productImage: TCreateProductImages;
};
