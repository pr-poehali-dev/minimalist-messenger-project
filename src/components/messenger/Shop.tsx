import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_SHOP = 'https://functions.poehali.dev/9c86760f-5d17-4ca7-8897-49fffde89de7';

interface ShopProps {
  userId: number;
}

const Shop = ({ userId }: ShopProps) => {
  const [gifts, setGifts] = useState<any[]>([]);
  const [myGifts, setMyGifts] = useState<any[]>([]);
  const [balance, setBalance] = useState({ balance: 0, raccoon_coins: 0 });
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadGifts();
    loadMyGifts();
    loadBalance();
  }, []);

  const loadGifts = async () => {
    try {
      const res = await fetch(`${API_SHOP}?action=get_gifts`);
      const data = await res.json();
      setGifts(data.gifts || []);
    } catch (error) {
      console.error('Failed to load gifts', error);
    }
  };

  const loadMyGifts = async () => {
    try {
      const res = await fetch(`${API_SHOP}?action=my_gifts`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await res.json();
      setMyGifts(data.gifts || []);
    } catch (error) {
      console.error('Failed to load my gifts', error);
    }
  };

  const loadBalance = async () => {
    try {
      const res = await fetch(`${API_SHOP}?action=get_balance`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await res.json();
      setBalance(data);
    } catch (error) {
      console.error('Failed to load balance', error);
    }
  };

  const buyGift = async (giftId: number) => {
    try {
      const res = await fetch(API_SHOP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId.toString() },
        body: JSON.stringify({ action: 'buy_gift', gift_id: giftId })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Подарок куплен!' });
        loadBalance();
        loadMyGifts();
        setSelectedGift(null);
      } else {
        toast({ title: 'Недостаточно енотиков', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка покупки', variant: 'destructive' });
    }
  };

  const groupedGifts = gifts.reduce((acc: any, gift) => {
    const category = gift.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(gift);
    return acc;
  }, {});

  const categoryNames: any = {
    flowers: '🌸 Цветы',
    love: '❤️ Любовь',
    jewelry: '💎 Украшения',
    food: '🍰 Еда',
    drinks: '🥂 Напитки',
    gifts: '🎁 Подарки',
    toys: '🧸 Игрушки',
    premium: '⭐ Премиум',
    special: '🔥 Специальные',
    animals: '🦝 Животные',
    fantasy: '🦄 Фантазия'
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1419] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Магазин подарков</h1>
          <div className="bg-[#1A1F2C] px-6 py-3 rounded-lg">
            <p className="text-gray-400 text-sm">Ваш баланс</p>
            <p className="text-2xl font-bold text-[#9b87f5]">🦝 {balance.raccoon_coins}</p>
          </div>
        </div>

        <Tabs defaultValue="shop" className="w-full">
          <TabsList className="bg-[#1A1F2C] mb-6">
            <TabsTrigger value="shop">Магазин</TabsTrigger>
            <TabsTrigger value="my">Мои подарки ({myGifts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="shop">
            {Object.entries(groupedGifts).map(([category, categoryGifts]: [string, any]) => (
              <div key={category} className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">{categoryNames[category] || category}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {categoryGifts.map((gift: any) => (
                    <button
                      key={gift.id}
                      onClick={() => setSelectedGift(gift)}
                      className="bg-[#1A1F2C] p-4 rounded-lg hover:bg-[#9b87f5]/10 hover:ring-2 ring-[#9b87f5] transition-all"
                    >
                      <div className="text-5xl mb-2">{gift.emoji}</div>
                      <p className="text-white text-sm font-medium">{gift.name}</p>
                      <p className="text-[#9b87f5] font-bold mt-2">🦝 {gift.price}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="my">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {myGifts.map((gift: any) => (
                <div
                  key={gift.id}
                  className="bg-[#1A1F2C] p-4 rounded-lg"
                >
                  <div className="text-5xl mb-2">{gift.emoji}</div>
                  <p className="text-white text-sm font-medium">{gift.name}</p>
                  {gift.sender && (
                    <p className="text-gray-400 text-xs mt-1">От: @{gift.sender}</p>
                  )}
                  <p className="text-[#9b87f5] text-xs mt-2">x{gift.quantity}</p>
                </div>
              ))}
              {myGifts.length === 0 && (
                <div className="col-span-full text-center text-gray-400 py-12">
                  У вас пока нет подарков
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedGift} onOpenChange={() => setSelectedGift(null)}>
          <DialogContent className="bg-[#1A1F2C] border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Купить подарок?</DialogTitle>
            </DialogHeader>
            {selectedGift && (
              <div className="text-center">
                <div className="text-8xl mb-4">{selectedGift.emoji}</div>
                <h3 className="text-2xl font-bold mb-2">{selectedGift.name}</h3>
                <p className="text-3xl text-[#9b87f5] font-bold mb-6">🦝 {selectedGift.price}</p>
                <Button
                  onClick={() => buyGift(selectedGift.id)}
                  className="w-full bg-[#9b87f5] hover:bg-[#7E69AB]"
                  disabled={balance.raccoon_coins < selectedGift.price}
                >
                  {balance.raccoon_coins >= selectedGift.price ? 'Купить' : 'Недостаточно енотиков'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Shop;
