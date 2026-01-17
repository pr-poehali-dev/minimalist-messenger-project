import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_PROFILE = 'https://functions.poehali.dev/d3bbd524-2bbb-4c3a-a512-cff22dca10a6';

interface ProfileProps {
  user: any;
  onUpdate: (user: any) => void;
}

const Profile = ({ user, onUpdate }: ProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [status, setStatus] = useState(user.status || '');
  const [statusEmoji, setStatusEmoji] = useState(user.status_emoji || '');
  const { toast } = useToast();

  const banners = [
    { id: 1, name: 'Темный лес', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800' },
    { id: 2, name: 'Горы', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' },
    { id: 3, name: 'Космос', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800' },
    { id: 4, name: 'Океан', url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800' },
  ];

  const saveProfile = async () => {
    try {
      const res = await fetch(API_PROFILE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id.toString() },
        body: JSON.stringify({
          action: 'update_profile',
          display_name: displayName,
          username,
          bio,
          status,
          status_emoji: statusEmoji
        })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Профиль обновлен' });
        onUpdate({ ...user, display_name: displayName, username, bio, status, status_emoji: statusEmoji });
        setIsEditing(false);
      }
    } catch (error) {
      toast({ title: 'Ошибка обновления', variant: 'destructive' });
    }
  };

  const setBanner = async (url: string) => {
    try {
      const res = await fetch(API_PROFILE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id.toString() },
        body: JSON.stringify({
          action: 'update_profile',
          banner_url: url
        })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Баннер обновлен' });
        onUpdate({ ...user, banner_url: url });
      }
    } catch (error) {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1419]">
      <div
        className="h-48 bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] relative"
        style={user.banner_url ? { backgroundImage: `url(${user.banner_url})`, backgroundSize: 'cover' } : {}}
      >
        <div className="absolute bottom-4 left-4">
          <Avatar className="w-24 h-24 border-4 border-[#0F1419]">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="bg-[#9b87f5] text-white text-3xl">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              {user.has_verification && (
                <Icon name="BadgeCheck" size={24} className="text-[#0EA5E9]" />
              )}
            </div>
            <p className="text-gray-400">@{username}</p>
            {status && (
              <p className="text-gray-300 mt-2">{statusEmoji} {status}</p>
            )}
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? 'destructive' : 'default'}
            className={isEditing ? '' : 'bg-[#9b87f5] hover:bg-[#7E69AB]'}
          >
            {isEditing ? 'Отмена' : 'Редактировать'}
          </Button>
        </div>

        {isEditing ? (
          <div className="space-y-4 bg-[#1A1F2C] p-4 rounded-lg">
            <div>
              <label className="text-gray-400 text-sm">Имя</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-[#0F1419] border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm">Юзернейм</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-[#0F1419] border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm">О себе</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-[#0F1419] border-gray-700 text-white"
              />
            </div>

            <div className="grid grid-cols-5 gap-2">
              <Input
                value={statusEmoji}
                onChange={(e) => setStatusEmoji(e.target.value)}
                placeholder="😎"
                className="bg-[#0F1419] border-gray-700 text-white col-span-1"
              />
              <Input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Статус"
                className="bg-[#0F1419] border-gray-700 text-white col-span-4"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Выбрать баннер</label>
              <div className="grid grid-cols-2 gap-2">
                {banners.map((banner) => (
                  <button
                    key={banner.id}
                    onClick={() => setBanner(banner.url)}
                    className="h-20 rounded-lg overflow-hidden hover:ring-2 ring-[#9b87f5] transition-all"
                  >
                    <img src={banner.url} alt={banner.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={saveProfile} className="w-full bg-[#9b87f5] hover:bg-[#7E69AB]">
              Сохранить изменения
            </Button>
          </div>
        ) : (
          <div className="bg-[#1A1F2C] p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">О себе</p>
            <p className="text-white">{bio || 'Нет описания'}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1A1F2C] p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Баланс</p>
            <p className="text-2xl font-bold text-white">{user.balance?.toFixed(2)} ₽</p>
          </div>
          <div className="bg-[#1A1F2C] p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Енотики</p>
            <p className="text-2xl font-bold text-[#9b87f5]">🦝 {user.raccoon_coins}</p>
          </div>
          <div className="bg-[#1A1F2C] p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">ID</p>
            <p className="text-xl font-bold text-white">{user.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
