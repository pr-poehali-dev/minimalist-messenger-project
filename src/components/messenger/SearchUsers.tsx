import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_PROFILE = 'https://functions.poehali.dev/d3bbd524-2bbb-4c3a-a512-cff22dca10a6';
const API_CHATS = 'https://functions.poehali.dev/6b4dc5fb-7ea7-4633-a410-cee9f5ae821d';

interface SearchUsersProps {
  userId: number;
  onChatCreated: (chatId: number) => void;
}

const SearchUsers = ({ userId, onChatCreated }: SearchUsersProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_PROFILE}?action=search_users&query=${encodeURIComponent(query)}`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Failed to search users', error);
      toast({ title: 'Ошибка поиска', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createChat = async (targetUserId: number, username: string) => {
    try {
      const res = await fetch(API_CHATS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({
          action: 'create_chat',
          type: 'private',
          name: username,
          members: [targetUserId]
        })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Чат создан!' });
        onChatCreated(data.chat_id);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      toast({ title: 'Ошибка создания чата', variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1419] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="Search" size={32} className="text-[#9b87f5]" />
          <h1 className="text-3xl font-bold text-white">Поиск пользователей</h1>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Введите имя или @username..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
            className="bg-[#1A1F2C] border-gray-700 text-white text-lg h-12"
          />
        </div>

        <div className="space-y-2">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9b87f5]"></div>
            </div>
          )}

          {!loading && searchResults.map((user: any) => (
            <div
              key={user.id}
              className="bg-[#1A1F2C] p-4 rounded-lg hover:bg-[#9b87f5]/10 transition-colors flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-[#9b87f5] flex items-center justify-center text-white text-2xl font-bold">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.username[0].toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-lg">{user.display_name}</p>
                  {user.has_verification && (
                    <Icon name="BadgeCheck" size={18} className="text-blue-400" />
                  )}
                </div>
                <p className="text-gray-400">@{user.username}</p>
              </div>
              <Button
                onClick={() => createChat(user.id, user.username)}
                className="bg-[#9b87f5] hover:bg-[#7E69AB]"
              >
                <Icon name="MessageCircle" size={16} className="mr-2" />
                Написать
              </Button>
            </div>
          ))}

          {!loading && searchQuery && searchResults.length === 0 && (
            <div className="text-center py-12">
              <Icon name="UserX" size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Пользователи не найдены</p>
              <p className="text-gray-500 text-sm mt-2">Попробуйте изменить запрос</p>
            </div>
          )}

          {!searchQuery && (
            <div className="text-center py-12">
              <Icon name="Users" size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Начните вводить имя или username</p>
              <p className="text-gray-500 text-sm mt-2">Найдите друзей и начните общаться!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchUsers;
