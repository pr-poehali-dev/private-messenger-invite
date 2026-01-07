import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainSidebar } from '@/components/messenger/MainSidebar';
import { ChatSidebar } from '@/components/messenger/ChatSidebar';
import { ChatHeader } from '@/components/messenger/ChatHeader';
import { MessageList } from '@/components/messenger/MessageList';
import { MessageInput } from '@/components/messenger/MessageInput';
import { mockChats, mockMessages, mockUsers, currentUser } from '@/lib/mockData';
import { Message } from '@/types';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export default function Messenger() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'chats' | 'profile' | 'admin' | 'members'>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(mockChats[0]?.id);
  const [messages, setMessages] = useState(mockMessages);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);

  const selectedChat = mockChats.find(c => c.id === selectedChatId);
  const chatMessages = messages.filter(m => m.chatId === selectedChatId);
  const otherUser = selectedChat?.participants.find(p => p.id !== currentUser.id);

  const handleSendMessage = (body: string) => {
    if (!selectedChatId) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId: selectedChatId,
      senderId: currentUser.id,
      body,
      createdAt: new Date(),
      status: 'sent',
    };

    setMessages([...messages, newMessage]);
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    setShowMobileSidebar(false);
  };

  const handleBackToList = () => {
    setShowMobileSidebar(true);
  };

  const handleLogout = () => {
    navigate('/auth');
  };

  if (activeView === 'profile') {
    return (
      <div className="h-screen flex">
        <MainSidebar
          currentUser={currentUser}
          activeView={activeView}
          onViewChange={setActiveView}
          onLogout={handleLogout}
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
          onLogout={handleLogout}
        />
        <div className="flex-1 p-8 bg-background overflow-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Участники сообщества
            </h1>
            <div className="grid gap-4 sm:grid-cols-2">
              {mockUsers.map((user) => (
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
          onLogout={handleLogout}
        />
        <div className="flex-1 p-8 bg-background overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Панель администратора
            </h1>
            
            <Card className="p-6 animate-fade-in">
              <h2 className="text-xl font-semibold mb-4">Создать инвайт-ссылку</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Создайте пригласительную ссылку для новых участников
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Макс. использований"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={5}
                />
                <input
                  type="number"
                  placeholder="Дней до истечения"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={7}
                />
              </div>
              <button className="mt-4 w-full h-10 rounded-md gradient-primary text-white font-medium hover:opacity-90 transition-opacity">
                Создать ссылку
              </button>
            </Card>

            <Card className="p-6 animate-fade-in">
              <h2 className="text-xl font-semibold mb-4">Активные инвайты</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <code className="text-sm font-mono">abc123xyz</code>
                    <p className="text-xs text-muted-foreground mt-1">2/5 использований · истекает через 6 дней</p>
                  </div>
                  <button className="text-sm text-destructive hover:underline">Отозвать</button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <code className="text-sm font-mono">def456uvw</code>
                    <p className="text-xs text-muted-foreground mt-1">1/1 использований · использован</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Завершён</span>
                </div>
              </div>
            </Card>
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
        onLogout={handleLogout}
      />

      <div className={`w-80 ${showMobileSidebar ? 'block' : 'hidden'} md:block`}>
        <ChatSidebar
          chats={mockChats}
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
              messages={chatMessages}
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
