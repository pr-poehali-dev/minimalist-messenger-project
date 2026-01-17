import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface MusicProps {
  userId: number;
}

const Music = ({ userId }: MusicProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      };
    }
  }, [currentTrack]);

  const searchMusic = async () => {
    if (!searchQuery.trim()) {
      toast({ title: 'Введите название трека', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=20`
      );
      const data = await res.json();
      setSearchResults(
        data.results.map((track: any) => ({
          id: track.trackId,
          name: track.trackName,
          artist: track.artistName,
          duration: Math.round(track.trackTimeMillis / 1000),
          previewUrl: track.previewUrl,
          artwork: track.artworkUrl100,
        }))
      );
    } catch (error) {
      toast({ title: 'Ошибка поиска', variant: 'destructive' });
    }
  };

  const addToPlaylist = (track: any) => {
    if (!playlist.find((t) => t.id === track.id)) {
      setPlaylist([...playlist, track]);
      toast({ title: 'Трек добавлен в плейлист' });
    }
  };

  const removeFromPlaylist = (trackId: number) => {
    setPlaylist(playlist.filter((t) => t.id !== trackId));
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  };

  const playTrack = (track: any) => {
    if (!track.previewUrl) {
      toast({ title: 'Превью недоступно', variant: 'destructive' });
      return;
    }
    setCurrentTrack(track);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = track.previewUrl;
      audioRef.current.play();
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
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
            <Button onClick={searchMusic} className="bg-[#9b87f5] hover:bg-[#7E69AB]">
              <Icon name="Search" size={20} />
            </Button>
          </div>
        </div>

        {currentTrack && (
          <div className="bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] p-6 rounded-xl mb-6 flex items-center gap-4">
            <img src={currentTrack.artwork} alt="" className="w-16 h-16 rounded-lg" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold truncate">{currentTrack.name}</p>
              <p className="text-white/80 text-sm">{currentTrack.artist}</p>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  <Icon name={isPlaying ? 'Pause' : 'Play'} size={20} />
                </Button>
                <div className="flex-1 bg-white/30 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-white h-full transition-all"
                    style={{ width: `${(currentTime / 30) * 100}%` }}
                  />
                </div>
                <span className="text-white text-xs">{formatDuration(Math.round(currentTime))}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Результаты поиска</h2>
            {searchResults.length === 0 ? (
              <div className="bg-[#1A1F2C] p-8 rounded-lg text-center text-gray-400">
                <Icon name="Music" size={48} className="mx-auto mb-4 opacity-30" />
                <p>Используйте поиск для поиска музыки</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((track) => (
                  <div
                    key={track.id}
                    className="bg-[#1A1F2C] p-4 rounded-lg flex items-center gap-4 hover:bg-[#9b87f5]/10 transition-colors"
                  >
                    {track.artwork && <img src={track.artwork} alt="" className="w-10 h-10 rounded" />}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 text-white hover:text-[#9b87f5]"
                      onClick={() => playTrack(track)}
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
            )}
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
                      onClick={() => playTrack(track)}
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

        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      </div>
    </div>
  );
};

export default Music;