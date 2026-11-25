'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { CallSession } from '@/types';
import { Avatar } from '@/components/ui/Avatar';

interface IncomingCallModalProps {
  call: CallSession | null;
  onAccept: (call: CallSession) => void;
  onReject: (call: CallSession) => void;
}

export function IncomingCallModal({ call, onAccept, onReject }: IncomingCallModalProps) {
  const [mounted, setMounted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Web Audio Ringtone untuk panggilan masuk
  const startIncomingRingtone = () => {
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
        osc1.frequency.setValueAtTime(520, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(660, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.setValueAtTime(0.12, now + 0.9);
        gain.gain.linearRampToValueAtTime(0, now + 1.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtxRef.current.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.05);
        osc2.stop(now + 1.05);
      };

      playBurst();
      ringIntervalRef.current = setInterval(playBurst, 2500);
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

  useEffect(() => {
    if (call) {
      startIncomingRingtone();
    } else {
      stopRingtone();
    }
    return () => stopRingtone();
  }, [call]);

  if (!call || !mounted) return null;

  const callerName =
    call.caller?.display_name || call.caller?.username || 'Seseorang';
  const callerAvatar = call.caller?.avatar_url || null;

  const handleAcceptClick = () => {
    stopRingtone();
    onAccept(call);
  };

  const handleRejectClick = () => {
    stopRingtone();
    onReject(call);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 select-none"
      style={{ touchAction: 'none' }}
    >
      <div className="w-full max-w-sm bg-[#111b21] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Radar pulsing ring */}
        <div className="relative my-4">
          <div className="absolute -inset-4 rounded-full bg-[#00a884]/25 animate-ping opacity-75" />
          <div className="absolute -inset-8 rounded-full bg-[#00a884]/15 animate-pulse" />
          <div className="relative rounded-full border-4 border-white/10 shadow-2xl scale-110">
            <Avatar src={callerAvatar} name={callerName} size="xl" />
          </div>
        </div>

        {/* Caller Info */}
        <div className="space-y-1.5 mt-4 mb-8">
          <h3 className="text-2xl font-bold text-white tracking-tight truncate max-w-[260px]">
            {callerName}
          </h3>
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#00a884] font-semibold uppercase tracking-wider">
            {call.call_type === 'video' ? (
              <>
                <Video size={14} />
                <span>Panggilan Video Masuk...</span>
              </>
            ) : (
              <>
                <Phone size={14} />
                <span>Panggilan Suara Masuk...</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-white/40">Terenkripsi end-to-end</p>
        </div>

        {/* Action Buttons: Reject & Accept */}
        <div className="flex items-center justify-center gap-8 w-full">
          {/* Reject Call (Red) */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleRejectClick}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Tolak Panggilan"
            >
              <PhoneOff size={26} />
            </button>
            <span className="text-xs text-white/70 font-medium">Tolak</span>
          </div>

          {/* Accept Call (Green) */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptClick}
              className="w-16 h-16 rounded-full bg-[#00a884] hover:bg-[#06cf9c] text-white flex items-center justify-center shadow-xl shadow-[#00a884]/40 transition-transform hover:scale-105 active:scale-95 cursor-pointer animate-bounce"
              title="Terima Panggilan"
            >
              <Phone size={26} />
            </button>
            <span className="text-xs text-white/70 font-medium">Terima</span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
