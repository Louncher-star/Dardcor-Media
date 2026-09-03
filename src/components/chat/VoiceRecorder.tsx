'use client';

import { Trash2, Send } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface VoiceRecorderProps {
  duration: number;
  levels: number[];
  onCancel: () => void;
  onSend: () => void;
  isUploading?: boolean;
}

export function VoiceRecorder({
  duration,
  levels,
  onCancel,
  onSend,
  isUploading = false,
}: VoiceRecorderProps) {
  return (
    <div className="flex-1 flex items-center justify-between px-4 py-2 bg-[var(--wa-header-bg)] rounded-xl border border-[var(--wa-border)] animate-in fade-in duration-150 select-none">
      {/* Red Dot & Timer */}
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
        <span className="text-sm font-mono font-medium text-[var(--wa-text-primary)]">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Waveform Visualization Bars */}
      <div className="flex items-center gap-1 h-6 px-4">
        {levels.map((lvl, idx) => (
          <div
            key={idx}
            style={{ height: `${Math.max(4, (lvl / 100) * 24)}px` }}
            className="w-1 bg-[#8b5cf6] rounded-full transition-all duration-75"
          />
        ))}
      </div>

      {/* Action Buttons: Cancel and Send */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          title="Batal"
          className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition"
        >
          <Trash2 size={18} />
        </button>

        <button
          onClick={onSend}
          disabled={isUploading}
          title="Kirim Pesan Suara"
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#9333ea] text-white flex items-center justify-center hover:from-[#8b5cf6] hover:to-[#7c3aed] shadow-md shadow-purple-900/40 transition disabled:opacity-50"
        >
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
