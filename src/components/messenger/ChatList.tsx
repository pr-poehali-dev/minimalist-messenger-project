import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_CHATS = 'https://functions.poehali.dev/6b4dc5fb-7ea7-4633-a410-cee9f5ae821d';
const API_PROFILE = 'https://functions.poehali.dev/d3bbd524-2bbb-4c3a-a512-cff22dca10a6';

interface ChatListProps {
  userId: number;
  onSelectChat: (chat: any) => void;
  selectedChatId?: number;
}

const ChatList = ({ userId, onSelectChat, selectedChatId }: ChatListProps) => {
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatType, setNewChatType] = useState<'private' | 'group' | 'channel'>('group');
  const { toast } = useToast();

  useEffect(() => {
    loadChats();
  }, [userId]);

  const loadChats = async () => {
    try {
      const res = await fetch(`${API_CHATS}?action=list_chats`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await res.json();
      setChats(data.chats || []);
    } catch (error) {
      console.error('Failed to load chats', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`${API_PROFILE}?action=search_users&query=${query}`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Search failed', error);
    }
  };

  const createChat = async () => {
    try {
      const res = await fetch(API_CHATS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId.toString() },
        body: JSON.stringify({
          action: 'create_chat',
          type: newChatType,
          name: newChatName,
          members: []
        })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Чат создан' });
        setShowNewChat(false);
        setNewChatName('');
        loadChats();
      }
    } catch (error) {
      toast({ title: 'Ошибка создания чата', variant: 'destructive' });
    }
  };

  const getChatIcon = (type: string) => {
    if (type === 'saved') return '🔖';
    if (type === 'group') return '👥';
    if (type === 'channel') return '📢';
    return '💬';
  };

  return (
    <div className="w-96 bg-[#1A1F2C] border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Input
            placeholder="Поиск пользователей..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
            className="bg-[#0F1419] border-gray-700 text-white"
          />
          <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
            <DialogTrigger asChild>
              <Button size="icon" className="bg-[#9b87f5] hover:bg-[#7E69AB] shrink-0">
                <Icon name="Plus" size={20} />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1A1F2C] border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Новый чат</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <select
                  value={newChatType}
                  onChange={(e) => setNewChatType(e.target.value as any)}
                  className="w-full p-2 bg-[#0F1419] border border-gray-700 rounded-md text-white"
                >
                  <option value="private">Личный чат</option>
                  <option value="group">Группа</option>
                  <option value="channel">Канал</option>
                </select>
                <Input
                  placeholder="Название"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="bg-[#0F1419] border-gray-700 text-white"
                />
                <Button onClick={createChat} className="w-full bg-[#9b87f5] hover:bg-[#7E69AB]">
                  Создать
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {searchQuery && searchResults.length > 0 ? (
          <div className="p-2">
            <p className="text-gray-400 text-xs px-2 mb-2">Результаты поиска</p>
            {searchResults.map((user) => (
              <button
                key={user.id}
                className="w-full p-3 hover:bg-[#0F1419] rounded-lg flex items-center gap-3 transition-colors"
              >
                <Avatar>
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-[#9b87f5] text-white">
                    {user.display_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-1">
                    <p className="text-white font-medium">{user.display_name}</p>
                    {user.has_verification && (
                      <Icon name="BadgeCheck" size={14} className="text-[#0EA5E9]" />
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">@{user.username}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className={`w-full p-3 hover:bg-[#0F1419] transition-colors flex items-center gap-3 ${
                selectedChatId === chat.id ? 'bg-[#0F1419]' : ''
              }`}
            >
              <div className="text-3xl">{getChatIcon(chat.type)}</div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-white font-medium truncate">{chat.name || 'Без названия'}</p>
                <p className="text-gray-400 text-sm truncate">{chat.last_message || 'Нет сообщений'}</p>
              </div>
              {chat.unread_count > 0 && (
                <div className="bg-[#9b87f5] text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {chat.unread_count}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
