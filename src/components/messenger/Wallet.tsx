import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_SHOP = 'https://functions.poehali.dev/9c86760f-5d17-4ca7-8897-49fffde89de7';
const API_PAYMENTS = 'https://functions.poehali.dev/67e1e046-f90a-4e98-b995-9f0f4b3391bf';

interface WalletProps {
  userId: number;
  onUpdateBalance: (balance: number, coins: number) => void;
}

const Wallet = ({ userId, onUpdateBalance }: WalletProps) => {
  const [balance, setBalance] = useState({ balance: 0, raccoon_coins: 0 });
  const [addAmount, setAddAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadBalance();
  }, []);

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

  const addBalance = async () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Неверная сумма', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch(API_PAYMENTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId.toString() },
        body: JSON.stringify({
          action: 'create_payment',
          amount: amount,
          return_url: window.location.href
        })
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = data.confirmation_url;
      }
    } catch (error) {
      toast({ title: 'Ошибка создания платежа', variant: 'destructive' });
    }
  };

  const buyRaccoonCoins = async () => {
    const amount = parseInt(buyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Неверное количество', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch(API_SHOP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId.toString() },
        body: JSON.stringify({ action: 'buy_raccoon_coins', amount })
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Енотики куплены!',
          description: `Вы получили ${data.received} енотиков (включая бонус 10%)`
        });
        setBuyAmount('');
        loadBalance();
        onUpdateBalance(balance.balance - amount, balance.raccoon_coins + data.received);
      } else {
        toast({ title: 'Недостаточно средств', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка покупки', variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1419] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Кошелек</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#9b87f5] to-[#7E69AB] p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Wallet" size={24} className="text-white" />
              <p className="text-white/80 text-sm">Баланс</p>
            </div>
            <p className="text-5xl font-bold text-white">{balance.balance.toFixed(2)} ₽</p>
          </div>

          <div className="bg-gradient-to-br from-[#D946EF] to-[#9b87f5] p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🦝</span>
              <p className="text-white/80 text-sm">Енотики</p>
            </div>
            <p className="text-5xl font-bold text-white">{balance.raccoon_coins}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#1A1F2C] p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4">Пополнить баланс</h2>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Сумма в рублях"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="bg-[#0F1419] border-gray-700 text-white"
              />
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => setAddAmount(amount.toString())}
                    variant="outline"
                    className="border-gray-700 hover:bg-[#9b87f5] hover:text-white"
                  >
                    {amount}₽
                  </Button>
                ))}
              </div>
              <Button onClick={addBalance} className="w-full bg-[#9b87f5] hover:bg-[#7E69AB]">
                <Icon name="CreditCard" size={16} className="mr-2" />
                Оплатить картой
              </Button>
              <p className="text-xs text-gray-400 text-center">Оплата через ЮKassa</p>
            </div>
          </div>

          <div className="bg-[#1A1F2C] p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4">Купить енотики</h2>
            <div className="bg-[#9b87f5]/10 p-4 rounded-lg mb-4 border border-[#9b87f5]">
              <p className="text-white text-sm">🎁 Бонус +10% при покупке!</p>
              <p className="text-gray-400 text-xs mt-1">При покупке 1000 енотиков вы получите 1100</p>
            </div>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Количество"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                className="bg-[#0F1419] border-gray-700 text-white"
              />
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => setBuyAmount(amount.toString())}
                    variant="outline"
                    className="border-gray-700 hover:bg-[#9b87f5] hover:text-white flex flex-col"
                  >
                    <span className="text-xs">🦝</span>
                    <span>{amount}</span>
                  </Button>
                ))}
              </div>
              <Button
                onClick={buyRaccoonCoins}
                className="w-full bg-[#D946EF] hover:bg-[#D946EF]/80"
                disabled={balance.balance === 0}
              >
                Купить за {buyAmount || '0'}₽
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;