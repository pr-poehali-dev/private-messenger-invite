import { User } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface MainSidebarProps {
  currentUser: User;
  activeView: 'chats' | 'profile' | 'admin' | 'members';
  onViewChange: (view: 'chats' | 'profile' | 'admin' | 'members') => void;
  onLogout: () => void;
}

export const MainSidebar = ({
  currentUser,
  activeView,
  onViewChange,
  onLogout,
}: MainSidebarProps) => {
  const { theme, toggleTheme } = useTheme();

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const NavButton = ({
    icon,
    view,
    label,
  }: {
    icon: string;
    view: typeof activeView;
    label: string;
  }) => (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onViewChange(view)}
      className={cn(
        'relative group h-12 w-12 transition-all',
        activeView === view
          ? 'bg-primary/10 text-primary hover:bg-primary/20'
          : 'hover:bg-accent/10'
      )}
      title={label}
    >
      <Icon name={icon} size={22} />
      {activeView === view && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
      )}
    </Button>
  );

  return (
    <div className="w-20 border-r bg-card flex flex-col items-center py-4 gap-4">
      <div className="mb-2">
        <Avatar className="h-12 w-12 border-2 border-primary/30 cursor-pointer hover:border-primary/50 transition-colors">
          <AvatarFallback className="gradient-primary text-white font-bold">
            {getInitials(currentUser.displayName)}
          </AvatarFallback>
        </Avatar>
      </div>

      <Separator className="w-12" />

      <nav className="flex-1 flex flex-col gap-2">
        <NavButton icon="MessageCircle" view="chats" label="Чаты" />
        <NavButton icon="Users" view="members" label="Участники" />
        {currentUser.isAdmin && (
          <NavButton icon="Shield" view="admin" label="Админ" />
        )}
      </nav>

      <div className="flex flex-col gap-2 mt-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-12 w-12 hover:bg-accent/10"
          title="Сменить тему"
        >
          <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={22} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewChange('profile')}
          className={cn(
            'h-12 w-12 transition-all',
            activeView === 'profile'
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'hover:bg-accent/10'
          )}
          title="Настройки"
        >
          <Icon name="Settings" size={22} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          className="h-12 w-12 hover:bg-destructive/10 hover:text-destructive"
          title="Выход"
        >
          <Icon name="LogOut" size={22} />
        </Button>
      </div>
    </div>
  );
};
