'use client';

import { Lock, Laptop, Smartphone, MessageSquare, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export function EmptyChatState() {
  return (
    <div className="flex-1 h-full bg-[var(--wa-chat-bg)] flex flex-col items-center justify-center p-8 select-none border-b-8 border-[#7c3aed]">
      <div className="max-w-md text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        {/* Modern Purple Illustration */}
        <div className="relative mb-8">
          <div className="w-56 h-36 rounded-2xl bg-[var(--wa-hover)] border-2 border-purple-500/20 flex items-center justify-center shadow-xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-indigo-500/10" />
            <Laptop size={72} className="text-purple-400/40 relative z-10" />
            <div className="absolute -bottom-2 -right-2 w-16 h-28 bg-[var(--wa-bg-sidebar)] border border-purple-500/30 rounded-xl shadow-2xl flex items-center justify-center z-20">
              <Smartphone size={32} className="text-[#8b5cf6]" />
            </div>
          </div>
          <div className="absolute -top-3 -left-3 w-11 h-11 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#a855f7] text-white flex items-center justify-center shadow-lg shadow-purple-500/30 animate-bounce z-30">
            <MessageSquare size={22} fill="currentColor" />
          </div>
        </div>

        {/* Title: Dardcor Media */}
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent mb-2">
          Dardcor Media
        </h2>

        {/* Description */}
        <p className="text-sm text-[var(--wa-text-secondary)] leading-relaxed mb-6">
          Platform perpesanan instan real-time modern untuk berkomunikasi dengan teman, keluarga, dan komunitas secara cepat dan aman.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 text-xs text-[var(--wa-text-secondary)]">
          <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1.5 text-purple-300">
            <Zap size={13} className="text-purple-400" /> Real-time Chat
          </span>
          <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1.5 text-purple-300">
            <Sparkles size={13} className="text-purple-400" /> Voice Notes & Media
          </span>
          <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1.5 text-purple-300">
            <ShieldCheck size={13} className="text-purple-400" /> Supabase Database
          </span>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 text-xs text-[var(--wa-text-secondary)]/80">
          <Lock size={13} />
          <span>Terkunci secara aman & terenkripsi end-to-end</span>
        </div>
      </div>
    </div>
  );
}
