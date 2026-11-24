'use client';

import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Profile } from '@/types';

interface CallModalProps {
  isOpen: boolean;
  callType: 'audio' | 'video';
  contact: Profile | null;
  chatName: string;
  onClose: () => void;
}

export function CallModal({
  isOpen,
  callType,
  contact,
  chatName,
  onClose,
}: CallModalProps) {
  const [callState, setCallState] = useState<'calling' | 'ringing' | 'connected' | 'ended'>('calling');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sintesis Ringback Tone menggunakan Web Audio API murni (tanpa file eksternal)
  const startRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const playRingBurst = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const now = audioCtxRef.current.currentTime;
        const osc1 = audioCtxRef.current.createOscillator();
        const osc2 = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now); // 440 Hz
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now); // 480 Hz

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

      playRingBurst();
      oscillatorIntervalRef.current = setInterval(playRingBurst, 3500);
    } catch {
      // AudioContext mungkin diblokir browser sebelum interaksi pengguna
    }
  };

  const stopRingtone = () => {
    if (oscillatorIntervalRef.current) {
      clearInterval(oscillatorIntervalRef.current);
      oscillatorIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
  };

  // Nada Panggilan Berakhir (End Call Tone)
  const playEndTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
      setTimeout(() => ctx.close(), 600);
    } catch {}
  };

  // Lifecycle Panggilan
  useEffect(() => {
    if (!isOpen) return;

    setCallState('calling');
    setDuration(0);
    setIsVideoEnabled(callType === 'video');

    // Mulai kamera jika panggilan video
    if (callType === 'video' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Izin kamera/mikrofon tidak diberikan:', err);
        });
    }

    startRingtone();

    // 1. Calling -> Ringing (setelah 2 detik)
    const ringTimer = setTimeout(() => {
      setCallState('ringing');
    }, 2000);

    // 2. Ringing -> Connected (setelah 4.5 detik)
    const connectTimer = setTimeout(() => {
      setCallState('connected');
      stopRingtone();
    }, 4500);

    return () => {
      clearTimeout(ringTimer);
      clearTimeout(connectTimer);
      stopRingtone();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [isOpen, callType]);

  // Timer Durasi Panggilan saat Terhubung
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
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setTimeout(() => {
      onClose();
    }, 800);
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

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md transition-all ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      <div
        className={`w-full max-w-lg bg-[#111b21] dark:bg-[#111b21] text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border border-white/10 ${
          isFullscreen ? 'max-w-none h-full rounded-none border-none' : 'h-[580px] sm:h-[620px]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="absolute top-0 inset-x-0 h-16 px-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00a884] animate-ping" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
              {callType === 'video' ? 'Panggilan Video' : 'Panggilan Suara'} • End-to-End Encrypted
            </span>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition"
            title={isFullscreen ? 'Kecilkan' : 'Perbesar'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

        {/* Central Display Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {/* Video Stream (if video call and enabled) */}
          {callType === 'video' && isVideoEnabled ? (
            <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Remote Participant Placeholder in Video Mode */}
              <div className="absolute top-20 right-4 w-32 h-44 rounded-2xl border-2 border-white/20 bg-black/60 backdrop-blur-sm overflow-hidden shadow-2xl flex flex-col items-center justify-center p-2 text-center">
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
            /* Audio Call / Avatar View */
            <div className="flex flex-col items-center justify-center z-10 space-y-5 animate-in fade-in duration-300">
              {/* Avatar with Animated Radar Rings */}
              <div className="relative">
                {callState !== 'ended' && (
                  <>
                    <div className="absolute -inset-4 rounded-full bg-[#00a884]/20 animate-ping opacity-60" />
                    <div className="absolute -inset-8 rounded-full bg-[#00a884]/10 animate-pulse" />
                  </>
                )}
                <div className="relative shadow-2xl rounded-full border-4 border-white/10">
                  <Avatar
                    src={contact?.avatar_url || null}
                    name={chatName}
                    size="xl"
                  />
                </div>
              </div>

              {/* Contact Name & Status */}
              <div className="text-center space-y-1.5">
                <h3 className="text-2xl font-bold tracking-tight text-white">{chatName}</h3>
                <p className="text-sm font-medium text-white/70">
                  {callState === 'calling' && 'Memanggil...'}
                  {callState === 'ringing' && 'Berdering...'}
                  {callState === 'connected' && formatCallTime(duration)}
                  {callState === 'ended' && 'Panggilan Berakhir'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Actions Bar */}
        <div className="h-24 px-6 z-20 flex items-center justify-center gap-5 sm:gap-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {/* Mute Mic */}
          <button
            onClick={handleToggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${
              isMuted
                ? 'bg-red-500 text-white'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isMuted ? 'Nyalakan Mikrofon' : 'Matikan Mikrofon'}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {/* Toggle Video (if video call) */}
          {callType === 'video' && (
            <button
              onClick={handleToggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${
                !isVideoEnabled
                  ? 'bg-red-500 text-white'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isVideoEnabled ? 'Matikan Kamera' : 'Nyalakan Kamera'}
            >
              {isVideoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
            </button>
          )}

          {/* Speaker Mute Toggle */}
          <button
            onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${
              isSpeakerMuted
                ? 'bg-red-500 text-white'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isSpeakerMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
          >
            {isSpeakerMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl transition hover:scale-105 active:scale-95"
            title="Akhiri Panggilan"
          >
            <PhoneOff size={26} />
          </button>
        </div>
      </div>
    </div>
  );
}
