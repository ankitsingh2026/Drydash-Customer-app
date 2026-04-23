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
};

export type order_details = CreatePickupRequest;
