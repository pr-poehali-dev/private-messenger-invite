import { User } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatHeaderProps {
  otherUser: User;
  onBack?: () => void;
  onUserClick: () => void;
}

export const ChatHeader = ({ otherUser, onBack, onUserClick }: ChatHeaderProps) => {
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3 p-4">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>
        )}

        <button
          onClick={onUserClick}
          className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="gradient-primary text-white font-semibold text-sm">
                {getInitials(otherUser.displayName)}
              </AvatarFallback>
            </Avatar>
            {otherUser.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-card rounded-full" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{otherUser.displayName}</h3>
            <p className="text-sm text-muted-foreground">
              {otherUser.isOnline ? 'В сети' : 'Не в сети'}
            </p>
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Icon name="MoreVertical" size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Icon name="User" size={16} className="mr-2" />
              Профиль
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icon name="Bell" size={16} className="mr-2" />
              Уведомления
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Icon name="Trash2" size={16} className="mr-2" />
              Удалить чат
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
