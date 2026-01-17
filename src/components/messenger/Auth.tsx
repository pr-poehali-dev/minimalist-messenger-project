import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_AUTH = 'https://functions.poehali.dev/cd29d05a-117f-45bb-a4e2-653693df8180';

interface AuthProps {
  onLogin: (user: any) => void;
}

const Auth = ({ onLogin }: AuthProps) => {
  const [step, setStep] = useState<'phone' | 'code' | 'register' | 'login'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const { toast } = useToast();

  const sendCode = async () => {
    try {
      const res = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_code', phone })
      });
      const data = await res.json();
      if (data.success) {
        setDevCode(data.dev_code);
        toast({ title: 'Код отправлен', description: `Код для разработки: ${data.dev_code}` });
        setStep('code');
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось отправить код', variant: 'destructive' });
    }
  };

  const verifyCode = async () => {
    try {
      const res = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_code', phone, code })
      });
      const data = await res.json();
      if (data.verified) {
        setStep('register');
      } else {
        toast({ title: 'Неверный код', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  const register = async () => {
    try {
      const res = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', phone, username, display_name: displayName, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      }
    } catch (error) {
      toast({ title: 'Ошибка регистрации', variant: 'destructive' });
    }
  };

  const login = async () => {
    try {
      const res = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', phone, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        toast({ title: 'Неверный логин или пароль', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка входа', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1419] via-[#1A1F2C] to-[#0F1419] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-6xl mb-4">💬</div>
          <h1 className="text-4xl font-bold text-white mb-2">Speakly</h1>
          <p className="text-gray-400">Безопасный мессенджер</p>
        </div>

        <div className="bg-[#1A1F2C] rounded-2xl p-6 shadow-xl border border-gray-800 animate-scale-in">
          {step === 'phone' && (
            <div className="space-y-4">
              <Input
                type="tel"
                placeholder="+7 999 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-[#0F1419] border-gray-700 text-white"
              />
              <Button onClick={sendCode} className="w-full bg-[#9b87f5] hover:bg-[#7E69AB]">
                Получить код
              </Button>
              <Button 
                onClick={() => { setStep('login'); setIsNewUser(false); }} 
                variant="ghost" 
                className="w-full text-gray-400"
              >
                Уже есть аккаунт? Войти
              </Button>
            </div>
          )}

          {step === 'code' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">Введите код из SMS</p>
              <p className="text-[#9b87f5] text-xs">Код для разработки: {devCode}</p>
              <Input
                type="text"
                placeholder="Код из SMS"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="bg-[#0F1419] border-gray-700 text-white"
              />
              <Button onClick={verifyCode} className="w-full bg-[#9b87f5] hover:bg-[#7E69AB]">
                Подтвердить
              </Button>
            </div>
          )}

          {step === 'register' && (
            <div className="space-y-4">
              <Input
                placeholder="Имя"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-[#0F1419] border-gray-700 text-white"
              />
              <Input
                placeholder="@username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-[#0F1419] border-gray-700 text-white"
              />
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#0F1419] border-gray-700 text-white"
              />
              <Button onClick={register} className="w-full bg-[#9b87f5] hover:bg-[#7E69AB]">
                Создать аккаунт
              </Button>
            </div>
          )}

          {step === 'login' && (
            <div className="space-y-4">
              <Input
                type="tel"
                placeholder="Телефон"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-[#0F1419] border-gray-700 text-white"
              />
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#0F1419] border-gray-700 text-white"
              />
              <Button onClick={login} className="w-full bg-[#9b87f5] hover:bg-[#7E69AB]">
                Войти
              </Button>
              <Button onClick={() => setStep('phone')} variant="ghost" className="w-full text-gray-400">
                Регистрация
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
