import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import Profile from './Profile';
import Shop from './Shop';
import Wallet from './Wallet';
import Music from './Music';
import Settings from './Settings';
import Friends from './Friends';

interface MainLayoutProps {
  user: any;
  onLogout: () => void;
}

const MainLayout = ({ user, onLogout }: MainLayoutProps) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'profile' | 'shop' | 'wallet' | 'music' | 'settings' | 'friends'>('chats');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [userData, setUserData] = useState(user);

  useEffect(() => {
    setUserData(user);
  }, [user]);

  const renderContent = () => {
    if (activeTab === 'chats') {
      return (
        <div className="flex h-full">
          <ChatList 
            userId={userData.id} 
            onSelectChat={setSelectedChat}
            selectedChatId={selectedChat?.id}
          />
          {selectedChat ? (
            <ChatWindow 
              chat={selectedChat} 
              userId={userData.id}
              username={userData.username}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <p>Выберите чат для начала общения</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'profile') {
      return <Profile user={userData} onUpdate={setUserData} />;
    }

    if (activeTab === 'shop') {
      return <Shop userId={userData.id} />;
    }

    if (activeTab === 'wallet') {
      return <Wallet userId={userData.id} onUpdateBalance={(balance, coins) => {
        setUserData({ ...userData, balance, raccoon_coins: coins });
      }} />;
    }

    if (activeTab === 'music') {
      return <Music userId={userData.id} />;
    }

    if (activeTab === 'friends') {
      return <Friends userId={userData.id} />;
    }

    if (activeTab === 'settings') {
      return <Settings user={userData} onLogout={onLogout} onUpdate={setUserData} />;
    }

    return null;
  };

  return (
    <div className="h-screen bg-[#0F1419] flex overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        user={userData}
      />
      <div className="flex-1 flex flex-col">
        {renderContent()}
      </div>
    </div>
  );
};

export default MainLayout;
