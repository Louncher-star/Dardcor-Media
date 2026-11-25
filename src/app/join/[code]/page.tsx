'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Shield, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Chat, Profile } from '@/types';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { getCurrentUser } from '@/lib/services/authService';
import { fetchGroupByInviteCode, joinGroupByInviteCode, fetchUserChats } from '@/lib/services/chatService';

interface JoinPageProps {
  params: Promise<{ code: string }>;
}

export default function JoinGroupPage({ params }: JoinPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code;
  const router = useRouter();

  const { user, setUser } = useAuthStore();
  const { setActiveChatId, setChats } = useChatStore();

  const [groupInfo, setGroupInfo] = useState<{ chat: Chat; participantCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const init = async () => {
      setLoading(true);
      // Cek auth pengguna saat ini
      const currentUser = await getCurrentUser();
      if (currentUser && alive) {
        setUser(currentUser);
      }

      // Ambil detail grup via invite code
      const result = await fetchGroupByInviteCode(code);
      if (alive) {
        if (result) {
          setGroupInfo(result);
        } else {
          setError('Tautan undangan ini sudah tidak valid atau kedaluwarsa.');
        }
        setLoading(false);
      }
    };

    init();
    return () => {
      alive = false;
    };
  }, [code, setUser]);

  const handleJoin = async () => {
    if (!user) {
      router.push(`/login?redirect=/join/${code}`);
      return;
    }

    if (!groupInfo) return;
    setJoining(true);
    try {
      const joinedChat = await joinGroupByInviteCode(code, user);
      if (joinedChat) {
        const freshChats = await fetchUserChats(user.id);
        setChats(freshChats);
        setActiveChatId(joinedChat.id);
        router.push('/chat');
      } else {
        setError('Gagal bergabung ke grup. Coba beberapa saat lagi.');
      }
    } catch (err) {
      console.error('Error joining group:', err);
      setError('Terjadi kesalahan saat bergabung.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0d0b14] text-white p-4 select-none">
        <div className="w-10 h-10 border-3 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-purple-300 font-medium">Memeriksa tautan undangan grup...</p>
      </div>
    );
  }

  if (error || !groupInfo) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0d0b14] text-white p-4 select-none">
        <div className="w-full max-w-sm bg-[#161224] border border-red-500/20 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-3">
            <AlertCircle size={26} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Undangan Tidak Valid</h3>
          <p className="text-xs text-white/60 mb-6">{error || 'Grup tidak ditemukan.'}</p>
          <button
            onClick={() => router.push('/chat')}
            className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
          >
            Buka Dardcor Media
          </button>
        </div>
      </div>
    );
  }

  const { chat, participantCount } = groupInfo;

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0d0b14] text-white p-4 select-none">
      <div className="w-full max-w-sm bg-[#161224] border border-purple-500/20 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center relative overflow-hidden">
        {/* Glow Background */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-600/20 to-transparent pointer-events-none" />

        <div className="p-1 rounded-full border-2 border-purple-500/50 mb-3 shadow-lg shadow-purple-900/30">
          <Avatar src={chat.group_avatar_url} name={chat.group_name || 'Grup'} size="xl" />
        </div>

        <h2 className="text-lg font-bold text-white mb-1">{chat.group_name || 'Grup Komunitas'}</h2>

        {chat.group_description && (
          <p className="text-xs text-white/70 mb-3 line-clamp-3 px-2">
            {chat.group_description}
          </p>
        )}

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-purple-300 font-medium mb-6">
          <Users size={14} />
          <span>{participantCount} anggota grup</span>
        </div>

        <div className="w-full space-y-2.5">
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-sm font-semibold transition shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {joining ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Bergabung...</span>
              </>
            ) : (
              <>
                <span>Gabung ke Grup</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <button
            onClick={() => router.push('/chat')}
            className="w-full py-2.5 rounded-full bg-transparent hover:bg-white/5 text-white/60 hover:text-white text-xs font-medium transition"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
