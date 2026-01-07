import { useState, useEffect } from 'react';
import { MainSidebar } from '@/components/messenger/MainSidebar';
import { ChatSidebar } from '@/components/messenger/ChatSidebar';
import { ChatHeader } from '@/components/messenger/ChatHeader';
import { MessageList } from '@/components/messenger/MessageList';
import { MessageInput } from '@/components/messenger/MessageInput';
import { AdminPanel } from '@/components/messenger/AdminPanel';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/hooks/useAuth';
import { useChats, useMessages } from '@/hooks/useChats';
import { invitesApi, usersApi } from '@/lib/api';
import { User, Invite } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Messenger() {
  const { currentUser, isLoading: authLoading, logout } = useAuth();
  const { chats, isLoading: chatsLoading, refetch: refetchChats } = useChats();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'chats' | 'profile' | 'admin' | 'members'>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  
  const { messages, sendMessage, refetch: refetchMessages } = useMessages(selectedChatId);

  const selectedChat = chats.find(c => c.id === selectedChatId);
  const otherUser = selectedChat?.participants.find(p => p.id !== currentUser?.id);

  useEffect(() => {
    if (chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats]);

  useEffect(() => {
    if (activeView === 'members') {
      loadUsers();
    } else if (activeView === 'admin' && currentUser?.isAdmin) {
      loadInvites();
    }
  }, [activeView]);

  const loadUsers = async () => {
    try {
      const response = await usersApi.listUsers();
      setUsers(response.users || []);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadInvites = async () => {
    try {
      const response = await invitesApi.listInvites();
      setInvites(response.invites || []);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async (body: string) => {
    try {
      await sendMessage(body);
    } catch (error: any) {
      toast({
        title: 'Ошибка отправки',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    setShowMobileSidebar(false);
  };

  const handleBackToList = () => {
    setShowMobileSidebar(true);
  };

  const handleCreateInvite = async (maxUses: number, daysValid: number) => {
    try {
      await invitesApi.createInvite(maxUses, daysValid);
      await loadInvites();
      toast({
        title: 'Инвайт создан',
        description: 'Пригласительная ссылка готова',
      });
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await invitesApi.revokeInvite(inviteId);
      await loadInvites();
      toast({
        title: 'Инвайт отозван',
        description: 'Ссылка больше не действует',
      });
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full gradient-primary animate-pulse" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (activeView === 'profile') {
    return (
      <div className="h-screen flex">
        <MainSidebar
          currentUser={currentUser}
          activeView={activeView}
          onViewChange={setActiveView}
          onLogout={logout}
        />
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <Card className="w-full max-w-2xl p-8 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full gradient-primary flex items-center justify-center text-white text-3xl font-bold">
                AS
              </div>
              <h2 className="text-2xl font-bold">{currentUser.displayName}</h2>
              <p className="text-muted-foreground">@{currentUser.username}</p>
              <div className="pt-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {currentUser.isAdmin ? 'Администратор' : 'Участник'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (activeView === 'members') {
    return (
      <div className="h-screen flex">
        <MainSidebar
          currentUser={currentUser}
          activeView={activeView}
          onViewChange={setActiveView}
          onLogout={logout}
        />
        <div className="flex-1 p-8 bg-background overflow-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Участники сообщества
            </h1>
            <div className="grid gap-4 sm:grid-cols-2">
              {users.map((user) => (
                <Card key={user.id} className="p-4 hover:shadow-lg transition-shadow animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg">
                        {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      {user.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 border-2 border-card rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{user.displayName}</h3>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      {user.isAdmin && (
                        <span className="text-xs text-primary">Администратор</span>
                      )}
                    </div>
                    {user.isOnline ? (
                      <span className="text-xs text-green-600 dark:text-green-400">В сети</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Не в сети</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'admin' && currentUser.isAdmin) {
    return (
      <div className="h-screen flex">
        <MainSidebar
          currentUser={currentUser}
          activeView={activeView}
          onViewChange={setActiveView}
          onLogout={logout}
        />
        <div className="flex-1 p-8 bg-background overflow-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Панель администратора
            </h1>
            <AdminPanel
              invites={invites}
              onCreateInvite={handleCreateInvite}
              onRevokeInvite={handleRevokeInvite}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <MainSidebar
        currentUser={currentUser}
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={logout}
      />

      <div className={`w-80 ${showMobileSidebar ? 'block' : 'hidden'} md:block`}>
        <ChatSidebar
          chats={chats}
          currentUser={currentUser}
          selectedChatId={selectedChatId}
          onChatSelect={handleChatSelect}
          onNewChat={() => {}}
        />
      </div>

      <div className={`flex-1 flex flex-col ${!showMobileSidebar ? 'flex' : 'hidden'} md:flex`}>
        {selectedChat && otherUser ? (
          <>
            <ChatHeader
              otherUser={otherUser}
              onBack={handleBackToList}
              onUserClick={() => {}}
            />
            <MessageList
              messages={messages}
              currentUserId={currentUser.id}
              otherUser={otherUser}
            />
            <MessageInput onSend={handleSendMessage} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 bg-background">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-24 h-24 mx-auto rounded-full gradient-secondary flex items-center justify-center">
                <Icon name="MessageCircle" size={48} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold">Выберите чат</h2>
              <p className="text-muted-foreground">
                Выберите беседу из списка или создайте новую, чтобы начать общение
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}