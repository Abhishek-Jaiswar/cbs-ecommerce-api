export interface IAddToCartDTO {
  cartId: string;
  variantId: string;
  quantity: number;
}

export interface IIncreaseCartQuantityDTO {
  variantId: string;
  cartItemId: string;
}
