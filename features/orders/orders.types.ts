export type CreatePickupItem = {
  itemId: string;
  quantity: number;
};

export type CreatePickupRequest = {
  firstName: string;
  lastName?: string;
  contact: string;
  appCustomerId: string;
  tempPickupAdresssId: string;
  tempDeliveryAddressId: string;
  date: string;
  slot?: string;
  note?: string;
  items?: CreatePickupItem[];
  bookingId?: string;
  isHeavy?: boolean;
  morning_delivery?: boolean;
};

export type order_details = CreatePickupRequest;
