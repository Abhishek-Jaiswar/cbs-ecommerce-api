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

export type TCreateOrder = {
  shippingAddress?: TShippingAddress;
  couponCode?: string | null;
  subTotal: string;
  shippingAmount: string;
  trackingNumber: string;
  orderNumber: string;
  paymentMethod: PaymentMethod;
  paymentProvider: PaymentProvider;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
};

export type TCartItem = {
  productId: string;
  variantId: string;
  name: string;
  sku?: string | null;
  image: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type TPlaceOrderInput = {
  addressId?: string | undefined;
  shippingAddress?: {
    fullname: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string | null | undefined;
    landmark?: string | null | undefined;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefaultShipping?: boolean | undefined;
    isDefaultBilling?: boolean | undefined;
  } | undefined;
  couponCode?: string | null | undefined;
  paymentMethod: PaymentMethod;
  paymentProvider: PaymentProvider;
  shippingAmount?: string | undefined;
  tax?: number | undefined;
};

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
