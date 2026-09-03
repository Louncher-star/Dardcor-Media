import { RegisterForm } from '@/components/auth/RegisterForm';
import { Lock, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0f0d19] relative selection:bg-[#7c3aed] selection:text-white overflow-y-auto">
      {/* Purple Gradient Top Banner */}
      <div className="h-64 bg-gradient-to-r from-[#4c1d95] via-[#6d28d9] to-[#4338ca] w-full absolute top-0 left-0 shadow-lg pointer-events-none" />

      {/* Main Container */}
      <div className="z-10 flex-1 flex flex-col items-center justify-start sm:justify-center p-4 py-8 sm:py-12 w-full">
        {/* Top Logo & Title */}
        <div className="flex items-center gap-3 text-white mb-6 select-none shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md text-purple-200 flex items-center justify-center shadow-xl shadow-purple-900/30">
            <MessageSquare size={24} fill="currentColor" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-wider block">DARDCOR MEDIA</span>
            <span className="text-[11px] text-purple-200/80 block">Platform Obrolan & Komunikasi Modern</span>
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-[#181427] rounded-3xl shadow-2xl border border-purple-500/20 p-6 sm:p-8 transition-colors backdrop-blur-xl shrink-0">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-white">
              Daftar Akun Baru
            </h1>
            <p className="text-xs text-purple-200/70 mt-1.5">
              Bergabung di Dardcor Media untuk terhubung dengan sesama
            </p>
          </div>

          <RegisterForm />
        </div>

        {/* Back to App Link & Footer Security */}
        <div className="mt-6 mb-8 flex flex-col items-center gap-3 text-xs text-purple-300/60 select-none shrink-0">
          <Link href="/" className="hover:text-purple-300 flex items-center gap-1.5 transition">
            <ArrowLeft size={14} />
            <span>Kembali ke Beranda Chat</span>
          </Link>

          <div className="flex items-center gap-2">
            <Lock size={12} />
            <span>Terkunci secara aman dengan Supabase Database</span>
          </div>
        </div>
      </div>
    </div>
  );
}
