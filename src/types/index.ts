export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  isAdmin: boolean;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  body: string;
  createdAt: Date;
  status: 'sending' | 'sent' | 'read';
}

export interface Chat {
  id: string;
  type: 'direct';
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
}

export interface Invite {
  id: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  maxUses: number;
  usedCount: number;
  revokedAt?: Date;
  createdBy: User;
}
