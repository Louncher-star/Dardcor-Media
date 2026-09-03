'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { Message } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { formatDuration } from '@/lib/utils';

interface VoiceMessageProps {
  message: Message;
  isMe: boolean;
}

export function VoiceMessage({ message, isMe }: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(message.media_duration || 0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch((e) => console.error(e));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = parseFloat(e.target.value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const cyclePlaybackRate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const rates: (1 | 1.5 | 2)[] = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 my-1 min-w-[240px] max-w-sm select-none">
      {message.media_url && (
        <audio ref={audioRef} src={message.media_url} preload="metadata" />
      )}

      {/* Mini Profile Avatar with Mic Badge */}
      <div className="relative shrink-0">
        <Avatar
          src={message.sender?.avatar_url}
          name={message.sender?.display_name || 'User'}
          size="md"
        />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#8b5cf6] text-white rounded-full flex items-center justify-center shadow-sm">
          <Mic size={10} />
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 flex items-center justify-center text-[var(--wa-text-primary)] transition shrink-0"
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </button>

      {/* Waveform Scrubber & Timer */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* Scrubber Bar */}
        <div className="relative flex items-center h-4 cursor-pointer group">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-[var(--wa-text-secondary)]/30 rounded-lg appearance-none cursor-pointer accent-[#8b5cf6]"
          />
        </div>

        {/* Duration & Speed */}
        <div className="flex items-center justify-between text-[11px] text-[var(--wa-text-secondary)] mt-0.5">
          <span>{isPlaying ? formatDuration(currentTime) : formatDuration(duration)}</span>
          <button
            onClick={cyclePlaybackRate}
            className="px-1.5 py-0.2 bg-black/5 dark:bg-white/5 rounded hover:bg-[#8b5cf6]/20 hover:text-[#c084fc] font-semibold text-[10px] transition"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}
