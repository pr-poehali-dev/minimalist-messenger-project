import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

const API_PROFILE = 'https://functions.poehali.dev/d3bbd524-2bbb-4c3a-a512-cff22dca10a6';

interface SettingsProps {
  user: any;
  onLogout: () => void;
  onUpdate: (user: any) => void;
}

const Settings = ({ user, onLogout, onUpdate }: SettingsProps) => {
  const [ghostMode, setGhostMode] = useState(user.ghost_mode || false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showBuyVerification, setShowBuyVerification] = useState(false);
  const { toast } = useToast();

  const toggleGhostMode = async (enabled: boolean) => {
    try {
      const res = await fetch(API_PROFILE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id.toString() },
        body: JSON.stringify({
          action: 'update_profile',
          ghost_mode: enabled
        })
      });
      const data = await res.json();
      if (data.success) {
        setGhostMode(enabled);
        onUpdate({ ...user, ghost_mode: enabled });
        toast({ title: enabled ? 'Режим призрака включен' : 'Режим призрака выключен' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  const buyVerification = async () => {
    try {
      const res = await fetch(API_PROFILE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id.toString() },
        body: JSON.stringify({ action: 'buy_verification' })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Галочка куплена!' });
        onUpdate({ ...user, has_verification: true, balance: user.balance - 5000 });
        setShowBuyVerification(false);
      } else {
        toast({ title: 'Недостаточно средств', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка покупки', variant: 'destructive' });
    }
  };

  const settings = [
    {
      title: 'Приватность',
      items: [
        {
          icon: 'Eye',
          label: 'Режим призрака',
          description: 'Никто не увидит, онлайн ли вы',
          action: (
            <Switch
              checked={ghostMode}
              onCheckedChange={toggleGhostMode}
            />
          ),
        },
      ],
    },
    {
      title: 'Премиум',
      items: [
        {
          icon: 'BadgeCheck',
          label: 'Галочка верификации',
          description: user.has_verification ? 'У вас есть галочка' : 'Купить за 5000₽',
          action: user.has_verification ? (
            <Icon name="Check" className="text-[#0EA5E9]" />
          ) : (
            <Button
              size="sm"
              onClick={() => setShowBuyVerification(true)}
              className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/80"
            >
              Купить
            </Button>
          ),
        },
      ],
    },
    {
      title: 'Общее',
      items: [
        {
          icon: 'Globe',
          label: 'Язык',
          description: 'Русский',
          action: <Icon name="ChevronRight" className="text-gray-400" />,
        },
        {
          icon: 'Palette',
          label: 'Тема',
          description: 'Темная',
          action: <Icon name="ChevronRight" className="text-gray-400" />,
        },
        {
          icon: 'HelpCircle',
          label: 'Служба поддержки',
          description: 'Помощь и FAQ',
          action: <Icon name="ChevronRight" className="text-gray-400" />,
        },
        {
          icon: 'Info',
          label: 'О приложении',
          description: 'Speakly v1.0',
          action: <Icon name="ChevronRight" className="text-gray-400" />,
        },
      ],
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1419] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">⚙️ Настройки</h1>

        {settings.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="text-lg font-semibold text-gray-400 mb-3">{section.title}</h2>
            <div className="bg-[#1A1F2C] rounded-lg overflow-hidden">
              {section.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 hover:bg-[#0F1419] transition-colors border-b border-gray-800 last:border-b-0"
                >
                  <Icon name={item.icon as any} size={24} className="text-[#9b87f5]" />
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.label}</p>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </div>
                  {item.action}
                </div>
              ))}
            </div>
          </div>
        ))}

        <Button
          onClick={() => setShowLogoutConfirm(true)}
          variant="destructive"
          className="w-full mt-6"
        >
          <Icon name="LogOut" size={20} className="mr-2" />
          Выйти из аккаунта
        </Button>

        <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <DialogContent className="bg-[#1A1F2C] border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Выйти из аккаунта?</DialogTitle>
              <DialogDescription className="text-gray-400">
                Вы уверены, что хотите выйти?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowLogoutConfirm(false)}
                variant="outline"
                className="flex-1 border-gray-700"
              >
                Отмена
              </Button>
              <Button
                onClick={onLogout}
                variant="destructive"
                className="flex-1"
              >
                Выйти
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showBuyVerification} onOpenChange={setShowBuyVerification}>
          <DialogContent className="bg-[#1A1F2C] border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Купить галочку верификации</DialogTitle>
              <DialogDescription className="text-gray-400">
                Стоимость: 5000₽
              </DialogDescription>
            </DialogHeader>
            <div className="text-center py-6">
              <Icon name="BadgeCheck" size={64} className="mx-auto mb-4 text-[#0EA5E9]" />
              <p className="text-white mb-2">Получите синюю галочку</p>
              <p className="text-gray-400 text-sm">Покажите всем, что вы настоящий!</p>
            </div>
            <Button
              onClick={buyVerification}
              className="w-full bg-[#0EA5E9] hover:bg-[#0EA5E9]/80"
              disabled={user.balance < 5000}
            >
              {user.balance >= 5000 ? 'Купить за 5000₽' : 'Недостаточно средств'}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Settings;
