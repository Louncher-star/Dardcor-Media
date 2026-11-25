'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Profile } from '@/types';
import { endCallSession, subscribeToCallSession } from '@/lib/services/callService';

interface CallModalProps {
  isOpen: boolean;
  sessionId?: string;
  isCaller?: boolean;
  callType: 'audio' | 'video';
  contact: Profile | null;
  chatName: string;
  onClose: () => void;
}

export function CallModal({
  isOpen,
  sessionId,
  isCaller = false,
  callType,
  contact,
  chatName,
  onClose,
}: CallModalProps) {
  const [mounted, setMounted] = useState(false);
  const [callState, setCallState] = useState<'calling' | 'ringing' | 'connected' | 'ended' | 'rejected'>(
    isCaller ? 'calling' : 'connected'
  );
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  const startRingtone = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const playBurst = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const now = audioCtxRef.current.currentTime;
        const osc1 = audioCtxRef.current.createOscillator();
        const osc2 = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        gain.gain.setValueAtTime(0.08, now + 1.2);
        gain.gain.linearRampToValueAtTime(0, now + 1.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtxRef.current.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.4);
        osc2.stop(now + 1.4);
      };

      playBurst();
      ringIntervalRef.current = setInterval(playBurst, 3500);
    } catch {}
  };

  const stopRingtone = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
  };

  const playEndTone = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      [0, 0.22, 0.44].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(425, now + offset);
        gain.gain.setValueAtTime(0.12, now + offset);
        gain.gain.linearRampToValueAtTime(0.001, now + offset + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.17);
      });
      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
      }, 800);
    } catch {}
  };

  useEffect(() => {
    if (!isOpen) return;

    setCallState(isCaller ? 'calling' : 'connected');
    setDuration(0);
    setIsVideoEnabled(callType === 'video');

    if (callType === 'video' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {});
    }

    if (isCaller) {
      startRingtone();
    } else {
      stopRingtone();
    }

    return () => {
      stopRingtone();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [isOpen, callType, isCaller]);

  useEffect(() => {
    if (!isOpen || !sessionId) return;

    const unsubscribe = subscribeToCallSession(sessionId, (session) => {
      if (session.status === 'accepted') {
        setCallState('connected');
        stopRingtone();
      } else if (session.status === 'rejected') {
        stopRingtone();
        playEndTone();
        setCallState('rejected');
        setTimeout(() => {
          onCloseRef.current();
        }, 1200);
      } else if (session.status === 'ended') {
        stopRingtone();
        playEndTone();
        setCallState('ended');
        setTimeout(() => {
          onCloseRef.current();
        }, 900);
      }
    });

    const handleBeforeUnload = () => {
      endCallSession(sessionId);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (!isOpen || !isCaller || callState !== 'calling') return;
    const timeout = setTimeout(() => {
      if (callState === 'calling') {
        if (sessionId) {
          endCallSession(sessionId);
        }
        stopRingtone();
        playEndTone();
        setCallState('ended');
        setTimeout(() => {
          onCloseRef.current();
        }, 1200);
      }
    }, 45000);

    return () => clearTimeout(timeout);
  }, [isOpen, isCaller, callState, sessionId]);

  useEffect(() => {
    if (callState !== 'connected') return;
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  const handleEndCall = () => {
    stopRingtone();
    playEndTone();
    setCallState('ended');
    if (sessionId) {
      endCallSession(sessionId);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleToggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !isMuted));
    }
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !isVideoEnabled));
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-xl p-0 sm:p-4 md:p-6 select-none overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      <div
        className={`w-full bg-[#111b21] text-white flex flex-col relative shadow-2xl transition-all ${
          isFullscreen
            ? 'h-full max-w-none rounded-none'
            : 'h-full sm:h-[560px] md:h-[600px] max-h-[100dvh] sm:max-h-[92vh] sm:max-w-md md:max-w-lg sm:rounded-3xl sm:border sm:border-white/10 sm:overflow-hidden'
        }`}
      >
        <div className="h-14 sm:h-16 px-4 flex items-center justify-between shrink-0 z-20 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00a884] animate-ping" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80 truncate max-w-[200px] sm:max-w-xs">
              {callType === 'video' ? 'Panggilan Video' : 'Panggilan Suara'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-full bg-black/30 hover:bg-black/60 text-white/80 hover:text-white transition"
              title={isFullscreen ? 'Kecilkan' : 'Perbesar'}
            >
              {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
            <button
              onClick={handleEndCall}
              className="p-2 rounded-full bg-black/30 hover:bg-rose-500/30 text-white/80 hover:text-rose-400 transition ml-1"
              title="Tutup / Akhiri Panggilan"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
          {callType === 'video' && isVideoEnabled ? (
            <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 w-28 h-36 sm:w-32 sm:h-44 rounded-2xl border-2 border-white/20 bg-black/60 backdrop-blur-sm overflow-hidden shadow-2xl flex flex-col items-center justify-center p-2 text-center z-10">
                <Avatar
                  src={contact?.avatar_url || null}
                  name={chatName}
                  size="md"
                />
                <span className="text-[11px] font-semibold text-white/90 truncate mt-2 max-w-full">
                  {chatName}
                </span>
                <span className="text-[9px] text-white/60">
                  {callState === 'connected' ? 'Aktif' : 'Menghubungkan...'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center z-10 space-y-4 sm:space-y-6">
              <div className="relative">
                {callState !== 'ended' && callState !== 'rejected' && (
                  <>
                    <div className="absolute -inset-3 sm:-inset-4 rounded-full bg-[#00a884]/20 animate-ping opacity-60" />
                    <div className="absolute -inset-6 sm:-inset-8 rounded-full bg-[#00a884]/10 animate-pulse" />
                  </>
                )}
                <div className="relative shadow-2xl rounded-full border-4 border-white/10 scale-90 sm:scale-100">
                  <Avatar
                    src={contact?.avatar_url || null}
                    name={chatName}
                    size="xl"
                  />
                </div>
              </div>

              <div className="text-center space-y-1 sm:space-y-1.5 px-4">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate max-w-[280px] sm:max-w-sm">
                  {chatName}
                </h3>
                <p className="text-sm font-medium text-white/70">
                  {callState === 'calling' && 'Memanggil...'}
                  {callState === 'ringing' && 'Berdering...'}
                  {callState === 'connected' && formatCallTime(duration)}
                  {callState === 'rejected' && 'Panggilan Ditolak'}
                  {callState === 'ended' && 'Panggilan Berakhir'}
                </p>
                <p className="text-[11px] text-white/40">
                  Terenkripsi secara menyeluruh
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 z-30 flex items-center justify-center gap-4 sm:gap-6 py-4 px-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleToggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg cursor-pointer ${
              isMuted
                ? 'bg-red-500 text-white shadow-red-500/30'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isMuted ? 'Nyalakan Mikrofon' : 'Matikan Mikrofon'}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {callType === 'video' && (
            <button
              type="button"
              onClick={handleToggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg cursor-pointer ${
                !isVideoEnabled
                  ? 'bg-red-500 text-white shadow-red-500/30'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isVideoEnabled ? 'Matikan Kamera' : 'Nyalakan Kamera'}
            >
              {isVideoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg cursor-pointer ${
              isSpeakerMuted
                ? 'bg-red-500 text-white shadow-red-500/30'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isSpeakerMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
          >
            {isSpeakerMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          </button>

          <button
            type="button"
            onClick={handleEndCall}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-rose-600/50"
            title="Akhiri Panggilan (Stop Telepon)"
          >
            <PhoneOff size={26} className="sm:scale-110" />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
