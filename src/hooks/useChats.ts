import { useState, useEffect } from 'react';
import { chatsApi } from '@/lib/api';
import { Chat, Message } from '@/types';

export const useChats = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const response = await chatsApi.listChats();
      setChats(response.chats || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  return { chats, isLoading, error, refetch: loadChats };
};

export const useMessages = (chatId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async () => {
    if (!chatId) return;
    
    try {
      setIsLoading(true);
      const response = await chatsApi.getMessages(chatId);
      setMessages(response.messages || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (body: string) => {
    if (!chatId) return;

    try {
      const response = await chatsApi.sendMessage(chatId, body);
      setMessages(prev => [...prev, response.message]);
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [chatId]);

  return { messages, isLoading, error, sendMessage, refetch: loadMessages };
};
