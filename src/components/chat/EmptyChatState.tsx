'use client';

import { Lock, MessageSquare, Smartphone } from 'lucide-react';

export function EmptyChatState() {
  return (
    <div className="flex-1 h-full bg-[var(--wa-chat-bg)] flex flex-col items-center justify-center select-none">
      <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-[560px] text-center">
        <div className="relative mb-9">
          <div className="w-[190px] h-[190px] rounded-full bg-[var(--wa-rail-active)] flex items-center justify-center">
            <MessageSquare
              size={82}
              className="text-[var(--wa-teal)] opacity-60"
              strokeWidth={1.1}
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-16 h-16 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#a855f7] text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Smartphone size={26} />
          </div>
        </div>

        <h2 className="text-[32px] leading-[38px] font-light text-[var(--wa-text-primary)] mb-3">
          Dardcor Media Web
        </h2>
        <p className="text-[14px] leading-[20px] text-[var(--wa-text-secondary)]">
          Kirim dan terima pesan tanpa perlu tetap online. Gunakan Dardcor Media di ponsel Anda
          untuk tetap terhubung kapan saja.
        </p>
      </div>

      <footer className="w-full py-3 flex items-center justify-center gap-1.5 text-[12px] text-[var(--wa-text-secondary)] border-t border-[var(--wa-border)]">
        <Lock size={12} />
        <span>Terenkripsi end-to-end</span>
      </footer>
    </div>
  );
}
