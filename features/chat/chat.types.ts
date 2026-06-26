// chat.types.ts
export interface Message {
  _id?: string;
  roomId: string;
  senderType: 'customer' | 'admin' | 'bot';
  senderId: string;
  message: string;
  messageType : string;
  fileUrl?: string;
  createdAt: string;
  isRead?: boolean;
  readAt? :string;
  delivered? : boolean;
  isDeleted: boolean;
}

export interface ChatRoom {
  _id: string;
  customerId: string;
  orderId?: string;
  chatType: 'global' | 'order';
  lastMessage: string;
  lastMessageAt: string;
  unreadCustomerCount: number;
  unreadAdminCount: number;
  status: 'open' | 'closed';
}


export interface Faq {
  _id: string;
  question: string;
  answer: string;
  category: string;
  answerType: 'static' | 'dynamic';
  action?: string;
}

export interface OrderInfo {
  order_id: string;
  status: string;
  deliveryType: string;
  plantName: string;
  createdAt: string;
}