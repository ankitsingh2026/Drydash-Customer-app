export type PaymentData = {
  payuUrl: string;
  key: string;
  txnid: string;
  amount: string | number;
  productinfo?: string;
  firstname?: string;
  email?: string;
  phone?: string;
  surl?: string;
  furl?: string;
  hash: string;
};

export type Props = {
  paymentData: PaymentData;
  orderId: string;
  onSuccess: (payload?: any) => void;
  onFailure?: (payload?: any) => void;
};
