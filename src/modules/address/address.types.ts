export type TCreateAddress = {
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
  userId: string;
};

export type TUpdateAddress = {
  fullname?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};
