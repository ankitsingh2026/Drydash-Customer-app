// chat.socket.ts
import { io, Socket } from 'socket.io-client';
import { Message } from './chat.types';

let socket: Socket | null = null;

export const connectChatSocket = (token?: string) => {
  const SOCKET_URL = "https://staging.shiptos.com"
  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: token ? { token } : undefined,
  });

  socket.on('connect', () => console.log('✅ Customer chat socket connected'));
  socket.on('disconnect', () => console.log('❌ Customer chat socket disconnected'));
  return socket;
};

export const disconnectChatSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinChatRoom = (roomId: string) => {
  if (socket) socket.emit('joinChatRoom', roomId);
};

export const sendMessageViaSocket = (
  roomId: string,
  senderType: string,
  senderId: string,
  message: string,
  messageType: string = 'text',   // default to 'text'
  fileUrl: string | null = null
) => {
  if (!socket) return;
  console.log("this is the sendChatMessage==>>",roomId,
    senderType,
    senderId,
    message,
    messageType,
    fileUrl)
  socket.emit('sendChatMessage', {
    roomId,
    senderType,
    senderId,
    message,
    messageType,
    fileUrl,
  });
};

// Listeners
export const onReceiveMessage = (callback: (msg: Message) => void) => {
  if (socket) socket.on('receiveChatMessage', callback);
};

export const offReceiveMessage = () => {
  if (socket) socket.off('receiveChatMessage');
};

// Typing indicators (optional)
export const sendTyping = (roomId: string, userId: string, userName: string) => {
  if (socket) socket.emit('typing', { roomId, userId, userName });
};

export const sendStopTyping = (roomId: string) => {
  if (socket) socket.emit('stopTyping', roomId);
};

export const onUserTyping = (callback: (data: { userId: string; userName: string }) => void) => {
  console.log("User typing event recieved from admin======>>")
  if (socket) socket.on('userTyping', callback);
};

export const offUserTyping = () => {
  if (socket) socket.off('userTyping');
};

// Add these exports
export const onUserStoppedTyping = (callback: () => void) => {
  if (socket) socket.on('userStoppedTyping', callback);
};

export const offUserStoppedTyping = () => {
  if (socket) socket.off('userStoppedTyping');
};