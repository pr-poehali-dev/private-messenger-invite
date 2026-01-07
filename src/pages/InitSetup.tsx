import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { initApi } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';

export default function InitSetup() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkInitStatus();
  }, []);

  const checkInitStatus = async () => {
    try {
      const response = await initApi.checkInit();
      if (response.initialized) {
        navigate('/auth');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    setIsLoading(true);
    try {
      const response = await initApi.createFirstInvite();
      setInviteToken(response.invite.token);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inviteUrl = inviteToken ? `${window.location.origin}/auth?invite=${inviteToken}` : '';

  const copyInviteUrl = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full gradient-primary animate-pulse" />
          <p className="text-muted-foreground">Проверка статуса...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-secondary">
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="bg-white/10 hover:bg-white/20 text-white"
        >
          <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={20} />
        </Button>
      </div>

      <Card className="w-full max-w-md animate-scale-in shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-2">
            <Icon name="Rocket" size={32} className="text-white" />
          </div>
          <CardTitle className="text-2xl">Добро пожаловать!</CardTitle>
          <CardDescription>
            Вы первый пользователь этого мессенджера
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!inviteToken ? (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Создайте свою первую инвайт-ссылку, чтобы зарегистрироваться как администратор мессенджера
              </p>

              {error && (
                <Alert variant="destructive">
                  <Icon name="AlertCircle" size={16} />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleCreateInvite}
                disabled={isLoading}
                className="w-full gradient-primary hover:opacity-90"
              >
                <Icon name="Plus" size={18} className="mr-2" />
                {isLoading ? 'Создание...' : 'Создать инвайт'}
              </Button>
            </>
          ) : (
            <>
              <Alert className="border-primary/50 bg-primary/5">
                <Icon name="CheckCircle" size={16} className="text-primary" />
                <AlertDescription className="text-primary font-medium">
                  Инвайт-ссылка успешно создана!
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm font-medium">Ваша инвайт-ссылка:</p>
                <div className="flex gap-2">
                  <code className="flex-1 p-3 rounded-md bg-muted text-sm break-all">
                    {inviteUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyInviteUrl}
                  >
                    <Icon name="Copy" size={18} />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Скопируйте эту ссылку и откройте в браузере для регистрации
              </p>

              <Button
                onClick={() => navigate(`/auth?invite=${inviteToken}`)}
                className="w-full gradient-primary hover:opacity-90"
              >
                <Icon name="ArrowRight" size={18} className="mr-2" />
                Перейти к регистрации
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
