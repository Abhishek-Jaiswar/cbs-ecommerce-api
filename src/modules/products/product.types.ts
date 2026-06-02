export type TMediaDTO = {
  url: string;
  storageKey: string;
  altText?: string;
};

export type TCreateProductImages = {
  productId: string;
  colorId: string | null;
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

export type TImageUpload = {
  images: Express.Multer.File[];
  productId: string;
  colorId: string;
};
