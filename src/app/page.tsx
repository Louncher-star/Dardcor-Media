'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Mic, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Download,
  Share2,
  Lock,
  Globe
} from 'lucide-react';
import { getCurrentUser } from '@/lib/services/authService';
import { Profile } from '@/types';

export default function LandingPage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getCurrentUser().then((u) => {
      if (u) setUser(u);
    });
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0b0914] text-white selection:bg-[#7c3aed] selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Background Neon Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-[600px] -left-40 w-[500px] h-[500px] bg-indigo-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-[1200px] -right-40 w-[600px] h-[600px] bg-violet-600/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0f0d19]/80 border-b border-purple-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#9333ea] flex items-center justify-center shadow-lg shadow-purple-900/40 group-hover:scale-105 transition-transform">
              <MessageSquare size={22} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
                Dardcor Media
              </span>
              <span className="text-[10px] text-purple-400 font-semibold tracking-widest uppercase">
                Next-Gen Chat
              </span>
            </div>
          </Link>

          {/* Center Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-purple-200/80">
            <a href="#fitur" className="hover:text-white transition">Fitur Utama</a>
            <a href="#keunggulan" className="hover:text-white transition">Keunggulan</a>
            <a href="#pwa" className="hover:text-white transition">PWA Mobile</a>
            <a href="#cara-kerja" className="hover:text-white transition">Cara Kerja</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {mounted && user ? (
              <Link
                href="/chat"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white font-medium text-sm transition flex items-center gap-2 shadow-lg shadow-purple-900/30"
              >
                <span>Buka Obrolan</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-purple-200 hover:text-white hover:bg-white/5 rounded-xl transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white font-medium text-sm transition flex items-center gap-2 shadow-lg shadow-purple-900/30"
                >
                  <span>Daftar Sekarang</span>
                  <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium mb-8 animate-in fade-in zoom-in duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Dardcor Media 2.0 • Mendukung PWA & Cloud Realtime</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight max-w-4xl leading-[1.15] mb-6">
          Komunikasi Cepat, Aman & Modern{' '}
          <span className="bg-gradient-to-r from-[#c084fc] via-[#a855f7] to-[#7c3aed] bg-clip-text text-transparent">
            Tanpa Batas
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-purple-200/70 max-w-2xl leading-relaxed mb-10">
          Nikmati kemudahan berkirim pesan instan, rekaman suara jernih, berbagi foto & dokumen, serta sinkronisasi multi-perangkat secara real-time dengan sentuhan desain ungu futuristik.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href={user ? "/chat" : "/register"}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#7c3aed] via-[#8b5cf6] to-[#9333ea] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white font-semibold rounded-2xl text-base transition flex items-center justify-center gap-3 shadow-xl shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{user ? "Masuk ke Obrolan Saya" : "Mulai Mengobrol Gratis"}</span>
            <ArrowRight size={18} />
          </Link>
          <a
            href="#fitur"
            className="w-full sm:w-auto px-7 py-4 bg-[#1a1528] hover:bg-[#231c38] border border-purple-500/25 text-purple-200 font-medium rounded-2xl text-base transition flex items-center justify-center gap-2"
          >
            <span>Pelajari Fitur</span>
          </a>
        </div>

        {/* Live Interactive Mockup Showcase */}
        <div className="mt-16 w-full max-w-5xl rounded-3xl p-3 sm:p-5 bg-gradient-to-b from-purple-500/20 via-purple-900/10 to-transparent border border-purple-500/30 shadow-2xl shadow-purple-950/70">
          <div className="w-full bg-[#120f20] rounded-2xl border border-purple-500/20 overflow-hidden shadow-inner flex flex-col">
            {/* Mock Header */}
            <div className="h-14 bg-[#181329] border-b border-purple-500/20 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-semibold text-purple-300/80 pl-2">
                  Dardcor Media Web Client
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-purple-300/70">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Terhubung Real-Time</span>
              </div>
            </div>

            {/* Mock Chat Area Preview */}
            <div className="p-6 sm:p-8 space-y-4 bg-gradient-to-b from-[#120f20] to-[#0f0d19] min-h-[320px] flex flex-col justify-end text-left">
              {/* Incoming Bubble */}
              <div className="flex items-start gap-3 max-w-md">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                  D
                </div>
                <div className="bg-[#1e1932] border border-purple-500/20 p-3.5 rounded-2xl rounded-tl-sm text-sm text-purple-100 shadow-md">
                  <p className="font-semibold text-xs text-[#c084fc] mb-1">Dardcor Team</p>
                  <p>Halo! Selamat datang di platform obrolan modern Dardcor Media. Semua pesan terenkripsi dan tersinkronisasi secara real-time! 🚀</p>
                  <span className="text-[10px] text-purple-300/50 block text-right mt-1">10:45</span>
                </div>
              </div>

              {/* Outgoing Bubble */}
              <div className="flex items-end justify-end gap-3 max-w-md self-end">
                <div className="bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] p-3.5 rounded-2xl rounded-tr-sm text-sm text-white shadow-lg shadow-purple-900/30">
                  <p>Keren banget warnanya! Tampilannya elegan dan sekarang sudah bisa diinstall sebagai aplikasi PWA di HP. 💜</p>
                  <div className="flex items-center justify-end gap-1.5 text-[10px] text-purple-200/70 mt-1">
                    <span>10:46</span>
                    <span>✓✓</span>
                  </div>
                </div>
              </div>

              {/* Voice Message Simulation */}
              <div className="flex items-start gap-3 max-w-xs">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                  R
                </div>
                <div className="bg-[#1e1932] border border-purple-500/20 p-3 rounded-2xl rounded-tl-sm text-sm text-purple-100 flex items-center gap-3 w-full shadow-md">
                  <div className="w-9 h-9 rounded-full bg-[#7c3aed] flex items-center justify-center text-white shrink-0 cursor-pointer">
                    <Mic size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="h-1.5 bg-purple-500/30 rounded-full overflow-hidden">
                      <div className="w-2/3 h-full bg-[#c084fc]" />
                    </div>
                    <span className="text-[10px] text-purple-300/60 block mt-1">Pesan Suara • 0:18</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#c084fc] mb-3">
            Fitur Utama
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Dirancang untuk Pengalaman Chatting Terbaik
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-[#141024] border border-purple-500/20 hover:border-purple-500/40 transition flex flex-col group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-[#c084fc] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Sinkronisasi Realtime</h4>
            <p className="text-sm text-purple-200/70 leading-relaxed">
              Didukung koneksi WebSockets Supabase berkecepatan tinggi. Pesan terkirim dan diterima dalam sepersekian detik.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-[#141024] border border-purple-500/20 hover:border-purple-500/40 transition flex flex-col group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Mic size={24} />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Voice Note & Media</h4>
            <p className="text-sm text-purple-200/70 leading-relaxed">
              Kirim pesan suara bergelombang audio interaktif, foto, video, dan dokumen tanpa batasan format.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-[#141024] border border-purple-500/20 hover:border-purple-500/40 transition flex flex-col group">
            <div className="w-12 h-12 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Smartphone size={24} />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Dukungan PWA Penuh</h4>
            <p className="text-sm text-purple-200/70 leading-relaxed">
              Pasang langsung di homescreen ponsel Android, iOS, maupun laptop Anda layaknya aplikasi asli tanpa memakan banyak memori.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-[#141024] border border-purple-500/20 hover:border-purple-500/40 transition flex flex-col group">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-500/15 text-fuchsia-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Keamanan & Privasi</h4>
            <p className="text-sm text-purple-200/70 leading-relaxed">
              Autentikasi berlapis dan kebijakan database ketat menjaga obrolan pribadi dan percakapan grup Anda tetap aman.
            </p>
          </div>
        </div>
      </section>

      {/* PWA Feature Showcase Banner */}
      <section id="pwa" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-[#1c1533] via-[#221a3f] to-[#17122b] border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c3aed]/20 text-[#c084fc] text-xs font-semibold mb-4">
              <Download size={14} />
              <span>Progressive Web App (PWA)</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Pasang Aplikasi di Ponsel & Laptop Anda
            </h3>
            <p className="text-sm text-purple-200/70 leading-relaxed mb-6">
              Akses Dardcor Media dengan satu ketukan dari layar utama perangkat Anda. Bekerja mulus, hemat kuota data, dan mendukung mode offline.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-purple-200">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-400" /> Kompatibel Android & iOS</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-400" /> Notifikasi Pesan Masuk</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-400" /> Ringan & Sangat Cepat</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Link
              href={user ? "/chat" : "/register"}
              className="px-6 py-3.5 bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white font-medium rounded-xl text-sm transition flex items-center gap-2 shadow-lg shadow-purple-900/40"
            >
              <Download size={16} />
              <span>Pasang / Buka Aplikasi</span>
            </Link>
            <span className="text-[11px] text-purple-400/60">Klik tombol install di browser Anda</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#c084fc] mb-3">
            Cara Kerja
          </h2>
          <h3 className="text-3xl font-extrabold tracking-tight">
            Mulai Terhubung Hanya dalam 3 Langkah
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#c084fc] flex items-center justify-center font-bold text-lg mb-4">
              1
            </div>
            <h4 className="text-base font-bold text-white mb-1">Daftar Akun</h4>
            <p className="text-xs text-purple-200/70 max-w-xs">
              Buat akun dalam hitungan detik dengan nama, username, dan foto profil pilihan Anda.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#c084fc] flex items-center justify-center font-bold text-lg mb-4">
              2
            </div>
            <h4 className="text-base font-bold text-white mb-1">Cari Kontak Rekan</h4>
            <p className="text-xs text-purple-200/70 max-w-xs">
              Klik tombol Obrolan Baru (+) untuk mencari teman yang terdaftar di seluruh dunia.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#c084fc] flex items-center justify-center font-bold text-lg mb-4">
              3
            </div>
            <h4 className="text-base font-bold text-white mb-1">Mulai Mengobrol</h4>
            <p className="text-xs text-purple-200/70 max-w-xs">
              Kirim pesan teks, rekaman suara, foto, atau buat grup obrolan bersama secara instan.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-[#261d44] to-[#161129] border border-purple-500/30 flex flex-col items-center shadow-2xl">
          <h3 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Siap Memulai Komunikasi Baru?
          </h3>
          <p className="text-sm text-purple-200/70 max-w-lg mb-8 leading-relaxed">
            Bergabunglah dengan Dardcor Media sekarang juga dan rasakan sensasi chatting berkecepatan tinggi dengan antarmuka ungu modern.
          </p>
          <Link
            href={user ? "/chat" : "/register"}
            className="px-8 py-4 bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white font-semibold rounded-2xl text-base transition flex items-center gap-2 shadow-xl shadow-purple-900/40"
          >
            <span>{user ? "Masuk ke Ruang Obrolan" : "Daftar Akun Gratis Sekarang"}</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-purple-500/15 py-10 px-4 sm:px-6 bg-[#090710]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-purple-400/60">
          <div className="flex items-center gap-2 text-white font-semibold">
            <div className="w-6 h-6 rounded-lg bg-[#7c3aed] flex items-center justify-center">
              <MessageSquare size={14} />
            </div>
            <span>Dardcor Media</span>
          </div>

          <p>© 2026 Dardcor Media. All rights reserved. Platform Obrolan Realtime Modern.</p>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-purple-300 transition">Masuk</Link>
            <Link href="/register" className="hover:text-purple-300 transition">Daftar</Link>
            <Link href="/chat" className="hover:text-purple-300 transition">Aplikasi Chat</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
