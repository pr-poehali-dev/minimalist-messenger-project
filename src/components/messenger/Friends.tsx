import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const API_PROFILE = 'https://functions.poehali.dev/d3bbd524-2bbb-4c3a-a512-cff22dca10a6';

interface FriendsProps {
  userId: number;
}

const Friends = ({ userId }: FriendsProps) => {
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const res = await fetch(`${API_PROFILE}?action=get_friends`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await res.json();
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Failed to load friends', error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1419] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">👥 Друзья</h1>

        {friends.length === 0 ? (
          <div className="bg-[#1A1F2C] p-12 rounded-xl text-center">
            <Icon name="Users" size={64} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">У вас пока нет друзей</p>
            <p className="text-gray-500 text-sm mt-2">Используйте поиск в чатах для добавления друзей</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-[#1A1F2C] p-4 rounded-lg hover:ring-2 ring-[#9b87f5] transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar>
                    <AvatarImage src={friend.avatar_url} />
                    <AvatarFallback className="bg-[#9b87f5] text-white">
                      {friend.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{friend.display_name}</p>
                    <p className="text-gray-400 text-sm">@{friend.username}</p>
                  </div>
                  {friend.is_online && (
                    <div className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-[#9b87f5] hover:bg-[#7E69AB]">
                    <Icon name="MessageCircle" size={16} className="mr-1" />
                    Написать
                  </Button>
                  <Button size="sm" variant="outline" className="border-gray-700">
                    <Icon name="Phone" size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
