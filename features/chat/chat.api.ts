// chat.api.ts
import axios from 'axios';
import { ChatRoom, Message, Faq, OrderInfo } from './chat.types';
import { oldApiClient } from '@/lib/api/client';

// ------------------- Room Management -------------------
export const getOrCreateRoom = async (
  customerId: string,
  orderId?: string,
  chatType: 'global' | 'order' = 'global'
): Promise<ChatRoom> => {
  const response = await oldApiClient.post('/v1/chat/create-room', { customerId, orderId, chatType });
  return response.data.room;
};

export const getRoomByCustomer = async (
  customerId: string,
  orderId?: string,
  chatType: 'global' | 'order' = 'global'
): Promise<ChatRoom | null> => {
  const response = await oldApiClient.get('/v1/chat/room/exists', {
    params: { customerId, orderId, chatType },
  });
  return response.data.room || null;
};

// ------------------- Messages -------------------
export const fetchMessages = async (roomId: string): Promise<Message[]> => {
  const response = await oldApiClient.get(`/v1/chat/messages/${roomId}`);

  console.log("Fetched messages for room", response.data.messages,"done------------------------------------");
  return response.data.messages;
};

export const sendMessage = async (
  roomId: string,
  senderType: 'customer' | 'admin',
  senderId: string,
  message: string
): Promise<Message> => {
  const response = await oldApiClient.post('/v1/chat/send-message', {
    roomId,
    senderType,
    senderId,
    message,
  });
  return response.data.messageData;
};

// ------------------- Bot -------------------
export const getBotReply = async (roomId: string, question: string): Promise<Message> => {
  const response = await oldApiClient.post('/v1/chat/bot-reply', { roomId, question });
  return response.data.message;
};

// ------------------- FAQ -------------------
export const fetchFaqs = async (category = 'general'): Promise<Faq[]> => {
  const response = await oldApiClient.get('/v1/chat/faqs', { params: { category } });
  return response.data.faqs;
};

// ------------------- Order Info -------------------
export const getOrdersByPhone = async (phone: string): Promise<OrderInfo[]> => {
  const response = await oldApiClient.get(`/v1/chat/orders-by-phone/${phone}`);
  return response.data.orders;
};

export const getOrderStatus = async (orderId: string): Promise<OrderInfo> => {
  const response = await oldApiClient.get(`/v1/chat/order-status/${orderId}`);
  return response.data.order;
};

export const markCustomerMessagesAsRead = async (roomId: string): Promise<void> => {
  await oldApiClient.put(`/v1/chat/customer/read/${roomId}`);
};