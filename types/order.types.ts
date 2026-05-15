export type Address = {
  id: string;
  label: string;
  flat: string;
  line1: string; // street / area
  street: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  landmark?: string;
  addressLine2?: string;
};
