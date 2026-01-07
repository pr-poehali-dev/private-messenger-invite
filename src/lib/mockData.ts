import { User, Chat, Message, Invite } from '@/types';

export const currentUser: User = {
  id: '1',
  username: 'alexsmith',
  displayName: 'Alex Smith',
  isAdmin: true,
  isOnline: true,
};

export const mockUsers: User[] = [
  currentUser,
  {
    id: '2',
    username: 'maryjane',
    displayName: 'Mary Jane',
    isAdmin: false,
    isOnline: true,
  },
  {
    id: '3',
    username: 'johnwick',
    displayName: 'John Wick',
    isAdmin: false,
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000),
  },
  {
    id: '4',
    username: 'sarahconnor',
    displayName: 'Sarah Connor',
    isAdmin: false,
    isOnline: true,
  },
];

export const mockMessages: Message[] = [
  {
    id: '1',
    chatId: 'chat-1',
    senderId: '2',
    body: 'Hey! How are you doing?',
    createdAt: new Date(Date.now() - 7200000),
    status: 'read',
  },
  {
    id: '2',
    chatId: 'chat-1',
    senderId: '1',
    body: 'Hi Mary! I\'m doing great, thanks for asking! 😊',
    createdAt: new Date(Date.now() - 7000000),
    status: 'read',
  },
  {
    id: '3',
    chatId: 'chat-1',
    senderId: '2',
    body: 'That\'s awesome! Did you check out the new features?',
    createdAt: new Date(Date.now() - 6900000),
    status: 'read',
  },
  {
    id: '4',
    chatId: 'chat-1',
    senderId: '1',
    body: 'Yes! The real-time messaging is super smooth',
    createdAt: new Date(Date.now() - 6800000),
    status: 'sent',
  },
  {
    id: '5',
    chatId: 'chat-2',
    senderId: '3',
    body: 'Are we still on for tomorrow?',
    createdAt: new Date(Date.now() - 3600000),
    status: 'read',
  },
  {
    id: '6',
    chatId: 'chat-2',
    senderId: '1',
    body: 'Absolutely! See you at 3 PM',
    createdAt: new Date(Date.now() - 3500000),
    status: 'sent',
  },
  {
    id: '7',
    chatId: 'chat-3',
    senderId: '4',
    body: 'Thanks for the invite! This looks amazing 🚀',
    createdAt: new Date(Date.now() - 1800000),
    status: 'read',
  },
];

export const mockChats: Chat[] = [
  {
    id: 'chat-1',
    type: 'direct',
    participants: [currentUser, mockUsers[1]],
    lastMessage: mockMessages[3],
    unreadCount: 0,
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'chat-2',
    type: 'direct',
    participants: [currentUser, mockUsers[2]],
    lastMessage: mockMessages[5],
    unreadCount: 0,
    createdAt: new Date(Date.now() - 172800000),
  },
  {
    id: 'chat-3',
    type: 'direct',
    participants: [currentUser, mockUsers[3]],
    lastMessage: mockMessages[6],
    unreadCount: 1,
    createdAt: new Date(Date.now() - 259200000),
  },
];

export const mockInvites: Invite[] = [
  {
    id: 'inv-1',
    token: 'abc123xyz',
    createdAt: new Date(Date.now() - 86400000),
    expiresAt: new Date(Date.now() + 518400000),
    maxUses: 5,
    usedCount: 2,
    createdBy: currentUser,
  },
  {
    id: 'inv-2',
    token: 'def456uvw',
    createdAt: new Date(Date.now() - 172800000),
    expiresAt: new Date(Date.now() + 432000000),
    maxUses: 1,
    usedCount: 1,
    createdBy: currentUser,
  },
  {
    id: 'inv-3',
    token: 'ghi789rst',
    createdAt: new Date(Date.now() - 259200000),
    expiresAt: new Date(Date.now() + 345600000),
    maxUses: 10,
    usedCount: 0,
    revokedAt: new Date(Date.now() - 86400000),
    createdBy: currentUser,
  },
];
