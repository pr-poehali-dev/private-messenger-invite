import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { useTheme } from '@/contexts/ThemeContext';
import { authApi, setAuthToken, setRefreshToken } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const inviteToken = searchParams.get('invite');
  
  const [isLogin, setIsLogin] = useState(!inviteToken);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await authApi.login(username, password);
        setAuthToken(response.accessToken);
        setRefreshToken(response.refreshToken);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        toast({
          title: 'Успешный вход',
          description: `Добро пожаловать, ${response.user.displayName}!`,
        });
      } else {
        if (!inviteToken) {
          toast({
            title: 'Ошибка',
            description: 'Инвайт-токен отсутствует',
            variant: 'destructive',
          });
          return;
        }
        const response = await authApi.register(username, displayName, password, inviteToken);
        setAuthToken(response.accessToken);
        setRefreshToken(response.refreshToken);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        toast({
          title: 'Регистрация успешна',
          description: `Добро пожаловать в мессенджер, ${response.user.displayName}!`,
        });
      }
      navigate('/messenger');
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Что-то пошло не так',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (inviteToken && !isLogin) {
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
              <Icon name="MessageCircle" size={32} className="text-white" />
            </div>
            <CardTitle className="text-2xl">Добро пожаловать!</CardTitle>
            <CardDescription>
              Вы приглашены присоединиться к приватному мессенджеру
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Alert className="mb-4 border-primary/50 bg-primary/5">
              <Icon name="Mail" size={16} />
              <AlertDescription>
                Инвайт-код: <code className="font-mono font-semibold">{inviteToken}</code>
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="alexsmith"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Отображаемое имя</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex Smith"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full gradient-primary hover:opacity-90" disabled={isLoading}>
                <Icon name="UserPlus" size={18} className="mr-2" />
                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="text-primary hover:underline font-medium"
              >
                Войти
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteToken && !isLogin) {
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

        <Card className="w-full max-w-md animate-scale-in shadow-2xl text-center">
          <CardHeader className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl gradient-primary flex items-center justify-center">
              <Icon name="Lock" size={40} className="text-white" />
            </div>
            <CardTitle className="text-2xl">Доступ по приглашению</CardTitle>
            <CardDescription className="text-base">
              Этот мессенджер доступен только по инвайт-ссылкам.
              <br />
              Попросите действующего участника отправить вам приглашение.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              onClick={() => setIsLogin(true)}
              variant="outline"
              className="w-full"
            >
              У меня уже есть аккаунт
            </Button>
          </CardContent>
        </Card>
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
            <Icon name="MessageCircle" size={32} className="text-white" />
          </div>
          <CardTitle className="text-2xl">Вход в мессенджер</CardTitle>
          <CardDescription>
            Введите свои учетные данные для входа
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Имя пользователя</Label>
              <Input
                id="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alexsmith"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Пароль</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full gradient-primary hover:opacity-90" disabled={isLoading}>
              <Icon name="LogIn" size={18} className="mr-2" />
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          {!inviteToken && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Нужно приглашение для регистрации
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}