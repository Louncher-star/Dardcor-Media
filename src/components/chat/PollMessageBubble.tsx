'use client';

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BarChart2, Check, CheckSquare, Square, Users, X } from 'lucide-react';
import { Message, PollData } from '@/types';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/Avatar';

interface PollMessageBubbleProps {
  message: Message;
  isMe: boolean;
}

export function PollMessageBubble({ message, isMe }: PollMessageBubbleProps) {
  const { user } = useAuthStore();
  const { updateMessage, chats } = useChatStore();
  const [showVotersModal, setShowVotersModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse poll data dari message.poll_data atau message.content
  const pollData: PollData | null = useMemo(() => {
    if (message.poll_data) return message.poll_data;
    if (message.content && message.content.startsWith('{')) {
      try {
        return JSON.parse(message.content);
      } catch {
        return null;
      }
    }
    return null;
  }, [message.poll_data, message.content]);

  // Hitung total pemilih unik & total suara
  const { totalUniqueVoters, totalVotes } = useMemo(() => {
    if (!pollData) return { totalUniqueVoters: 0, totalVotes: 0 };
    const allUserIds = new Set<string>();
    let total = 0;
    for (const opt of pollData.options) {
      total += (opt.votes || []).length;
      for (const uId of opt.votes || []) {
        allUserIds.add(uId);
      }
    }
    return { totalUniqueVoters: allUserIds.size, totalVotes: total };
  }, [pollData]);

  if (!pollData) {
    return (
      <div className="p-3 italic text-xs text-[var(--wa-text-secondary)]">
        Format jajak pendapat tidak valid.
      </div>
    );
  }

  const handleVote = async (optionId: string) => {
    if (!user) return;

    const updatedOptions = pollData.options.map((opt) => {
      const votes = opt.votes ? [...opt.votes] : [];
      const hasVotedThis = votes.includes(user.id);

      if (opt.id === optionId) {
        if (hasVotedThis) {
          // Batal vote opsi ini
          return { ...opt, votes: votes.filter((id) => id !== user.id) };
        } else {
          // Tambah vote opsi ini
          return { ...opt, votes: [...votes, user.id] };
        }
      } else {
        // Jika tidak mengizinkan multiple answers, hapus vote user dari opsi lain
        if (!pollData.allow_multiple) {
          return { ...opt, votes: votes.filter((id) => id !== user.id) };
        }
        return opt;
      }
    });

    const updatedPollData: PollData = {
      ...pollData,
      options: updatedOptions,
      total_votes: updatedOptions.reduce((acc, curr) => acc + (curr.votes?.length || 0), 0),
    };

    const newContent = JSON.stringify(updatedPollData);

    // Update state di client store
    updateMessage(message.chat_id, message.id, {
      content: newContent,
      poll_data: updatedPollData,
    });

    // Simpan ke Supabase jika terhubung
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase
          .from('messages')
          .update({
            content: newContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', message.id);
      } catch (err) {
        console.error('Error saving poll vote to Supabase:', err);
      }
    }
  };

  // Dapatkan profil anggota di obrolan ini untuk modal "Lihat Suara"
  const currentChat = chats.find((c) => c.id === message.chat_id);
  const participants = currentChat?.participants || [];

  return (
    <div className="w-full min-w-[240px] max-w-[340px] sm:max-w-[380px] select-none py-1">
      {/* Poll Header */}
      <div className="flex items-start gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center shrink-0 mt-0.5">
          <BarChart2 size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-sm sm:text-[15px] text-[var(--wa-text-primary)] leading-snug break-words">
            {pollData.question}
          </h4>
          <span className="text-[11px] text-[var(--wa-text-secondary)] block mt-0.5">
            {pollData.allow_multiple ? 'Pilih satu atau beberapa' : 'Pilih satu jawaban'}
          </span>
        </div>
      </div>

      {/* Options List */}
      <div className="space-y-1.5 my-2">
        {pollData.options.map((opt) => {
          const hasVoted = Boolean(user && opt.votes?.includes(user.id));
          const voteCount = opt.votes?.length || 0;
          const percentage =
            totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              className={`w-full relative overflow-hidden text-left p-2.5 rounded-xl border transition group flex flex-col justify-center cursor-pointer ${
                hasVoted
                  ? 'border-[#00a884] bg-[#00a884]/10 dark:bg-[#00a884]/15'
                  : 'border-[var(--wa-border)]/60 bg-black/5 dark:bg-white/5 hover:border-[var(--wa-border)] hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              {/* Progress bar background */}
              {voteCount > 0 && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-300 pointer-events-none rounded-l-xl ${
                    hasVoted
                      ? 'bg-[#00a884]/25'
                      : 'bg-[var(--wa-border)]/30 dark:bg-white/10'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Option Row */}
              <div className="relative z-10 flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Radio / Checkbox Indicator */}
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                      hasVoted
                        ? 'bg-[#00a884] border-[#00a884] text-white shadow-sm'
                        : 'border-[var(--wa-text-secondary)] bg-transparent'
                    }`}
                  >
                    {hasVoted && <Check size={11} strokeWidth={3} />}
                  </div>
                  <span
                    className={`text-xs sm:text-[13px] font-medium truncate ${
                      hasVoted
                        ? 'text-[var(--wa-text-primary)] font-semibold'
                        : 'text-[var(--wa-text-primary)]'
                    }`}
                  >
                    {opt.text}
                  </span>
                </div>

                {/* Vote Count & Percent */}
                <div className="flex items-center gap-1.5 shrink-0 text-right">
                  {voteCount > 0 && (
                    <span className="text-[11px] font-mono text-[var(--wa-text-secondary)]">
                      {percentage}%
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-[var(--wa-text-secondary)] px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5">
                    {voteCount}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer: View Votes Button */}
      <div className="pt-1.5 flex items-center justify-between border-t border-[var(--wa-border)]/40 mt-2">
        <span className="text-[11px] text-[var(--wa-text-secondary)]">
          {totalUniqueVoters} pemilih ({totalVotes} total suara)
        </span>
        <button
          type="button"
          onClick={() => setShowVotersModal(true)}
          className="text-xs font-semibold text-[#00a884] hover:text-[#06cf9c] hover:underline transition"
        >
          Lihat suara
        </button>
      </div>

      {/* Voters Modal rendered in Portal */}
      {showVotersModal &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowVotersModal(false)}
          >
            <div
              className="w-full max-w-sm bg-[var(--wa-bg-sidebar)] border border-[var(--wa-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-12 px-4 bg-[var(--wa-header-bg)] border-b border-[var(--wa-border)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#00a884]" />
                  <h3 className="font-semibold text-sm text-[var(--wa-text-primary)]">
                    Rincian Suara
                  </h3>
                </div>
                <button
                  onClick={() => setShowVotersModal(false)}
                  className="p-1 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {pollData.options.map((opt) => {
                  const voters = (opt.votes || []).map((vId) => {
                    if (user && vId === user.id) return user;
                    const found = participants.find((p) => p.user_id === vId);
                    return (
                      found?.profile || {
                        id: vId,
                        username: 'Pengguna',
                        display_name: 'Pengguna',
                        avatar_url: null,
                      }
                    );
                  });

                  return (
                    <div key={opt.id} className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[var(--wa-text-primary)] border-b border-[var(--wa-border)] pb-1">
                        <span>{opt.text}</span>
                        <span className="text-[var(--wa-text-secondary)] font-normal">
                          {voters.length} suara
                        </span>
                      </div>

                      {voters.length === 0 ? (
                        <p className="text-xs text-[var(--wa-text-secondary)] italic pl-1">
                          Belum ada yang memilih opsi ini.
                        </p>
                      ) : (
                        <div className="space-y-1.5 pl-1">
                          {voters.map((v, i) => (
                            <div key={i} className="flex items-center gap-2.5">
                              <Avatar
                                src={v.avatar_url || null}
                                name={v.display_name || v.username || 'U'}
                                size="sm"
                              />
                              <span className="text-xs text-[var(--wa-text-primary)] font-medium truncate">
                                {v.display_name || v.username}
                                {user && v.id === user.id ? ' (Anda)' : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
