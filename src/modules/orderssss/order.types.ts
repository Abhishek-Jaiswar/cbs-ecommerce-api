import type { Prisma } from "../../generated/prisma/client.js";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
} from "../../generated/prisma/enums.js";

export type TShippingAddress = {
  fullname: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};
export type TCreateOrderDTO = {
  shippingAddress?: TShippingAddress;
  addressId?: string;
  couponCode?: string | null;
  subTotal: string;
  shippingAmount: string;
  paymentMethod: PaymentMethod;
  paymentProvider: PaymentProvider;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
};

// Represents the full nested Prisma structure of a Cart Item with variant, product, and media details
export type TCartItemWithDetails = {
  id: string;
  quantity: number;
  cartId: string;
  variantId: string;
  variant: {
    id: string;
    sku: string | null;
    price: Prisma.Decimal | null;
    stock: number;
    productId: string;
    product: {
      id: string;
      name: string;
      price: Prisma.Decimal;
      images: Array<{
        id: string;
        position: number;
        isPrimary: boolean;
        mediaId: string;
        colorId: string | null;
        productId: string;
        media: {
          id: string;
          url: string;
          storageKey: string;
          altText: string | null;
          createdAt: Date;
          updatedAt: Date;
        };
      }>;
    };
    color: {
      id: string;
      name: string;
      hex: string | null;
      productId: string;
    };
    size: {
      id: string;
      value: string;
      productId: string;
    };
  };
};

export type TPlaceOrderInput = {
  addressId?: string;
  shippingAddress?: {
    fullname: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string | null;
    landmark?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefaultShipping?: boolean;
    isDefaultBilling?: boolean;
  };
  couponCode?: string | null;
  paymentMethod: PaymentMethod;
  paymentProvider: PaymentProvider;
  shippingAmount?: string;
  tax?: number;
};
