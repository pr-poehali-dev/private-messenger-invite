import { Message, User } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/icon';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  otherUser: User;
}

export const MessageList = ({ messages, currentUserId, otherUser }: MessageListProps) => {
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full gradient-primary flex items-center justify-center">
            <Icon name="MessageCircle" size={32} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold">Начните общение</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Отправьте первое сообщение, чтобы начать чат с {otherUser.displayName}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4 max-w-4xl mx-auto">
        {messages.map((message, index) => {
          const isOwn = message.senderId === currentUserId;
          const showAvatar = !isOwn && (index === 0 || messages[index - 1].senderId !== message.senderId);

          return (
            <div
              key={message.id}
              className={cn(
                'flex gap-2 animate-fade-in',
                isOwn ? 'justify-end' : 'justify-start'
              )}
            >
              {!isOwn && (
                <div className="flex-shrink-0">
                  {showAvatar ? (
                    <Avatar className="h-8 w-8 border border-primary/20">
                      <AvatarFallback className="gradient-primary text-white text-xs font-semibold">
                        {getInitials(otherUser.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8" />
                  )}
                </div>
              )}

              <div
                className={cn(
                  'max-w-[70%] space-y-1',
                  isOwn && 'flex flex-col items-end'
                )}
              >
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 shadow-sm',
                    isOwn
                      ? 'gradient-primary text-white rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.body}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-1">
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.createdAt)}
                  </span>
                  {isOwn && (
                    <Icon
                      name={message.status === 'read' ? 'CheckCheck' : 'Check'}
                      size={14}
                      className={cn(
                        message.status === 'read' ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
