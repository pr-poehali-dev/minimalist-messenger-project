import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import EmojiPicker from './EmojiPicker';

const API_CHATS = 'https://functions.poehali.dev/6b4dc5fb-7ea7-4633-a410-cee9f5ae821d';

interface ChatWindowProps {
  chat: any;
  userId: number;
  username: string;
}

const ChatWindow = ({ chat, userId, username }: ChatWindowProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [chat.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const res = await fetch(`${API_CHATS}?action=get_messages&chat_id=${chat.id}`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(API_CHATS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId.toString() },
        body: JSON.stringify({
          action: 'send_message',
          chat_id: chat.id,
          content: newMessage,
          message_type: 'text',
          reply_to: replyTo?.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        setReplyTo(null);
        loadMessages();
      }
    } catch (error) {
      toast({ title: 'Ошибка отправки', variant: 'destructive' });
    }
  };

  const addReaction = async (messageId: number, emoji: string) => {
    try {
      await fetch(API_CHATS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId.toString() },
        body: JSON.stringify({
          action: 'add_reaction',
          message_id: messageId,
          emoji
        })
      });
      loadMessages();
    } catch (error) {
      console.error('Failed to add reaction', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0F1419]">
      <div className="h-16 border-b border-gray-800 flex items-center px-4 bg-[#1A1F2C]">
        <div className="text-2xl mr-3">
          {chat.type === 'saved' && '🔖'}
          {chat.type === 'group' && '👥'}
          {chat.type === 'channel' && '📢'}
          {chat.type === 'private' && '💬'}
        </div>
        <div className="flex-1">
          <h2 className="text-white font-semibold">{chat.name}</h2>
          <p className="text-gray-400 text-xs">
            {chat.type === 'group' && 'Группа'}
            {chat.type === 'channel' && 'Канал'}
            {chat.type === 'saved' && 'Только вы'}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <Icon name="Search" size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <Icon name="Phone" size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <Icon name="Video" size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <Icon name="MoreVertical" size={20} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === userId;
          return (
            <div
              key={msg.id}
              className={`flex gap-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isOwn && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={msg.sender_avatar} />
                  <AvatarFallback className="bg-[#9b87f5] text-white text-xs">
                    {msg.sender_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isOwn && (
                  <p className="text-[#9b87f5] text-xs font-medium mb-1">{msg.sender_name}</p>
                )}

                {msg.reply_to && (
                  <div className="bg-[#1A1F2C] px-3 py-1 rounded-lg mb-1 border-l-2 border-[#9b87f5] text-xs text-gray-400">
                    Ответ на сообщение
                  </div>
                )}

                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-[#9b87f5] text-white'
                      : 'bg-[#1A1F2C] text-white'
                  }`}
                >
                  {msg.message_type === 'voice' && (
                    <div className="flex items-center gap-2">
                      <Icon name="Mic" size={16} />
                      <div className="h-1 bg-white/30 rounded-full w-32" />
                      <span className="text-xs">{msg.duration}s</span>
                    </div>
                  )}
                  {msg.message_type === 'text' && <p>{msg.content}</p>}
                  {msg.message_type === 'photo' && (
                    <img src={msg.file_url} alt="" className="max-w-xs rounded-lg" />
                  )}
                </div>

                <div className="flex items-center gap-1 mt-1">
                  <p className="text-gray-500 text-xs">
                    {new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex gap-1">
                      {msg.reactions.map((r: any, i: number) => (
                        <span key={i} className="text-xs bg-[#1A1F2C] px-1 rounded">
                          {r.emoji} {r.count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs text-gray-400"
                    onClick={() => setReplyTo(msg)}
                  >
                    <Icon name="Reply" size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs text-gray-400"
                    onClick={() => addReaction(msg.id, '❤️')}
                  >
                    ❤️
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs text-gray-400"
                    onClick={() => addReaction(msg.id, '👍')}
                  >
                    👍
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800 bg-[#1A1F2C]">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between bg-[#0F1419] px-3 py-2 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Icon name="Reply" size={14} className="text-[#9b87f5]" />
              <span className="text-gray-400">Ответ на: {replyTo.content?.substring(0, 30)}...</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>
              <Icon name="X" size={14} />
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="shrink-0 text-gray-400">
            <Icon name="Paperclip" size={20} />
          </Button>

          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Сообщение..."
            className="bg-[#0F1419] border-gray-700 text-white"
          />

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-gray-400"
            onClick={() => setShowEmoji(!showEmoji)}
          >
            <Icon name="Smile" size={20} />
          </Button>

          <Button variant="ghost" size="icon" className="shrink-0 text-gray-400">
            <Icon name="Mic" size={20} />
          </Button>

          <Button
            onClick={sendMessage}
            size="icon"
            className="bg-[#9b87f5] hover:bg-[#7E69AB] shrink-0"
          >
            <Icon name="Send" size={20} />
          </Button>
        </div>

        {showEmoji && (
          <EmojiPicker
            onSelect={(emoji) => {
              setNewMessage(newMessage + emoji);
              setShowEmoji(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
