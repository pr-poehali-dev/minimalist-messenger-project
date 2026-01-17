import Icon from '@/components/ui/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  user: any;
}

const Sidebar = ({ activeTab, onTabChange, user }: SidebarProps) => {
  const tabs = [
    { id: 'chats', icon: 'MessageCircle', label: 'Чаты' },
    { id: 'friends', icon: 'Users', label: 'Друзья' },
    { id: 'shop', icon: 'Gift', label: 'Магазин' },
    { id: 'wallet', icon: 'Wallet', label: 'Кошелек' },
    { id: 'music', icon: 'Music', label: 'Музыка' },
    { id: 'settings', icon: 'Settings', label: 'Настройки' },
  ];

  return (
    <div className="w-20 bg-[#1A1F2C] border-r border-gray-800 flex flex-col items-center py-4 space-y-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onTabChange('profile')}
            className="relative group"
          >
            <Avatar className="w-12 h-12 ring-2 ring-[#9b87f5] ring-offset-2 ring-offset-[#1A1F2C]">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-[#9b87f5] text-white">
                {user.display_name?.charAt(0) || user.username?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            {user.has_verification && (
              <div className="absolute -bottom-1 -right-1 bg-[#0EA5E9] rounded-full p-0.5">
                <Icon name="Check" size={12} className="text-white" />
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Профиль</TooltipContent>
      </Tooltip>

      <div className="h-px w-10 bg-gray-700" />

      {tabs.map((tab) => (
        <Tooltip key={tab.id}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onTabChange(tab.id)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#9b87f5] text-white shadow-lg shadow-[#9b87f5]/30'
                  : 'text-gray-400 hover:bg-[#0F1419] hover:text-white'
              }`}
            >
              <Icon name={tab.icon as any} size={24} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{tab.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};

export default Sidebar;
