import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface MusicProps {
  userId: number;
}

const Music = ({ userId }: MusicProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [playlist, setPlaylist] = useState<any[]>([]);

  const mockTracks = [
    { id: 1, name: 'Summer Vibes', artist: 'Artist One', duration: 240 },
    { id: 2, name: 'Night Drive', artist: 'Artist Two', duration: 195 },
    { id: 3, name: 'Chill Beats', artist: 'Artist Three', duration: 210 },
    { id: 4, name: 'Electronic Dreams', artist: 'Artist Four', duration: 270 },
    { id: 5, name: 'Sunset Mix', artist: 'Artist Five', duration: 225 },
  ];

  const addToPlaylist = (track: any) => {
    if (!playlist.find((t) => t.id === track.id)) {
      setPlaylist([...playlist, track]);
    }
  };

  const removeFromPlaylist = (trackId: number) => {
    setPlaylist(playlist.filter((t) => t.id !== trackId));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F1419] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">🎵 Музыка</h1>

        <div className="bg-[#1A1F2C] p-4 rounded-lg mb-6">
          <div className="flex gap-2">
            <Input
              placeholder="Поиск музыки..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0F1419] border-gray-700 text-white"
            />
            <Button className="bg-[#9b87f5] hover:bg-[#7E69AB]">
              <Icon name="Search" size={20} />
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Популярные треки</h2>
            <div className="space-y-2">
              {mockTracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-[#1A1F2C] p-4 rounded-lg flex items-center gap-4 hover:bg-[#9b87f5]/10 transition-colors"
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-white hover:text-[#9b87f5]"
                  >
                    <Icon name="Play" size={20} />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{track.name}</p>
                    <p className="text-gray-400 text-sm">{track.artist}</p>
                  </div>
                  <p className="text-gray-400 text-sm">{formatDuration(track.duration)}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-white hover:text-[#9b87f5]"
                    onClick={() => addToPlaylist(track)}
                  >
                    <Icon name="Plus" size={20} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">Мой плейлист ({playlist.length})</h2>
            {playlist.length === 0 ? (
              <div className="bg-[#1A1F2C] p-8 rounded-lg text-center text-gray-400">
                <Icon name="Music" size={48} className="mx-auto mb-4 opacity-30" />
                <p>Плейлист пуст</p>
              </div>
            ) : (
              <div className="space-y-2">
                {playlist.map((track) => (
                  <div
                    key={track.id}
                    className="bg-[#1A1F2C] p-4 rounded-lg flex items-center gap-4"
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 text-white hover:text-[#9b87f5]"
                    >
                      <Icon name="Play" size={20} />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{track.name}</p>
                      <p className="text-gray-400 text-sm">{track.artist}</p>
                    </div>
                    <p className="text-gray-400 text-sm">{formatDuration(track.duration)}</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 text-red-400 hover:text-red-500"
                      onClick={() => removeFromPlaylist(track.id)}
                    >
                      <Icon name="X" size={20} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Music;
