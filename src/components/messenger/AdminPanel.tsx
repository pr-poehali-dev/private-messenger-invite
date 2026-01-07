import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Invite } from '@/types';
import Icon from '@/components/ui/icon';

interface AdminPanelProps {
  invites: Invite[];
  onCreateInvite: (maxUses: number, daysValid: number) => Promise<void>;
  onRevokeInvite: (inviteId: string) => Promise<void>;
}

export const AdminPanel = ({ invites, onCreateInvite, onRevokeInvite }: AdminPanelProps) => {
  const [maxUses, setMaxUses] = useState(5);
  const [daysValid, setDaysValid] = useState(7);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await onCreateInvite(maxUses, daysValid);
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'истёк';
    if (days === 0) return 'истекает сегодня';
    if (days === 1) return 'истекает завтра';
    return `истекает через ${days} дн.`;
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/auth?invite=${token}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4">Создать инвайт-ссылку</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Создайте пригласительную ссылку для новых участников
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="maxUses">Макс. использований</Label>
            <Input
              id="maxUses"
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              min={1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="daysValid">Дней до истечения</Label>
            <Input
              id="daysValid"
              type="number"
              value={daysValid}
              onChange={(e) => setDaysValid(Number(e.target.value))}
              min={1}
            />
          </div>
        </div>
        <Button
          onClick={handleCreate}
          disabled={isCreating}
          className="w-full gradient-primary hover:opacity-90"
        >
          <Icon name="Plus" size={18} className="mr-2" />
          {isCreating ? 'Создание...' : 'Создать ссылку'}
        </Button>
      </Card>

      <Card className="p-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4">Активные инвайты</h2>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Нет активных инвайтов
          </p>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => {
              const isExpired = new Date(invite.expiresAt) < new Date();
              const isUsedUp = invite.usedCount >= invite.maxUses;
              const isRevoked = !!invite.revokedAt;
              const isActive = !isExpired && !isUsedUp && !isRevoked;

              return (
                <div
                  key={invite.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isActive ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-muted'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono font-semibold">{invite.token}</code>
                      {isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyInviteLink(invite.token)}
                          className="h-6 px-2"
                        >
                          <Icon name="Copy" size={14} />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {invite.usedCount}/{invite.maxUses} использований · {formatDate(invite.expiresAt)}
                      {isRevoked && ' · отозван'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                          Активен
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRevokeInvite(invite.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          Отозвать
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        Неактивен
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
