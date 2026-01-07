import { Chat, User } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  chats: Chat[];
  currentUser: User;
  selectedChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export const ChatSidebar = ({
  chats,
  currentUser,
  selectedChatId,
  onChatSelect,
  onNewChat,
}: ChatSidebarProps) => {
  const getOtherParticipant = (chat: Chat): User => {
    return chat.participants.find(p => p.id !== currentUser.id) || chat.participants[0];
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    
    if (hours < 1) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m`;
    }
    if (hours < 24) {
      return `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="flex flex-col h-full border-r bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Чаты
          </h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onNewChat}
            className="hover:bg-primary/10"
          >
            <Icon name="Plus" size={20} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chats.map((chat) => {
            const otherUser = getOtherParticipant(chat);
            const isSelected = chat.id === selectedChatId;

            return (
              <button
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-lg transition-all hover:bg-accent/10',
                  'text-left group animate-fade-in',
                  isSelected && 'bg-primary/10 hover:bg-primary/15'
                )}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="gradient-primary text-white font-semibold">
                      {getInitials(otherUser.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  {otherUser.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 border-2 border-card rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm truncate">
                      {otherUser.displayName}
                    </span>
                    {chat.lastMessage && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage?.body || 'Нет сообщений'}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
