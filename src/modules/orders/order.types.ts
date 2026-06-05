export type TShippingAddress = {
  addressLine1: string;
  addressLine2?: string;
  landmark: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type TCustomer = {
  fullname: string;
  phoneNumber: string;
};

export type TCreateOrderDTO = {
  addressId: string;
  customer: TCustomer;
  shippingAddress: TShippingAddress;
  appliedCouponCode?: string | null;
};
