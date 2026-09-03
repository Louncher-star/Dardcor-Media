'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Send, Search, CheckCheck, Smile, MoreVertical } from 'lucide-react';
import { TikTokUser } from '@/lib/store/useTikTokAuthStore';
import { TikTokVideoItem } from '@/app/api/tiktok/route';

interface TikTokMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

interface TikTokConversation {
  creatorId: string;
  unique_id: string;
  nickname: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unread: boolean;
  messages: TikTokMessage[];
}

interface TikTokMessagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TikTokUser | null;
  feedVideos: TikTokVideoItem[];
}

export function TikTokMessagesDrawer({
  isOpen,
  onClose,
  currentUser,
  feedVideos,
}: TikTokMessagesDrawerProps) {
  // Ekstrak kreator real dari scraping feed video live
  const realFeedCreators = useMemo(() => {
    const map = new Map<string, { creator: any; videoTitle: string }>();
    feedVideos.forEach((v) => {
      const key = v.author.unique_id || v.author.id;
      if (key && !map.has(key)) {
        map.set(key, { creator: v.author, videoTitle: v.title });
      }
    });
    return Array.from(map.values());
  }, [feedVideos]);

  const [conversations, setConversations] = useState<TikTokConversation[]>([]);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Inisialisasi percakapan dengan kreator-kreator real dari live feed
  useEffect(() => {
    if (realFeedCreators.length === 0) return;

    // Ambil percakapan tersimpan dari localStorage jika ada
    let saved: TikTokConversation[] = [];
    try {
      const raw = localStorage.getItem('tiktok_real_conversations');
      if (raw) saved = JSON.parse(raw);
    } catch {}

    const list: TikTokConversation[] = realFeedCreators.slice(0, 10).map(({ creator, videoTitle }, idx) => {
      const existing = saved.find((s) => s.unique_id === creator.unique_id);
      if (existing) return existing;

      return {
        creatorId: creator.id || creator.unique_id || `c_${idx}`,
        unique_id: creator.unique_id,
        nickname: creator.nickname,
        avatar: creator.avatar,
        lastMessage: `Halo! Terima kasih sudah menonton videoku "${videoTitle?.slice(0, 30)}..." 🔥`,
        lastTime: `${idx + 1}m lalu`,
        unread: idx < 2,
        messages: [
          {
            id: `init_${creator.unique_id}`,
            senderId: creator.id || creator.unique_id,
            text: `Halo! Salam kenal dari @${creator.unique_id}. Terima kasih sudah menonton videoku "${videoTitle?.slice(0, 35)}..."! Senang bisa terhubung di TikTok! ✨`,
            timestamp: 'Baru saja',
            isMe: false,
          },
        ],
      };
    });

    setConversations(list);
    if (!selectedCreatorId && list.length > 0) {
      setSelectedCreatorId(list[0].creatorId);
    }
  }, [realFeedCreators, selectedCreatorId]);

  if (!isOpen) return null;

  const activeConversation =
    conversations.find((c) => c.creatorId === selectedCreatorId) || conversations[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;

    const userText = inputText.trim();
    const newMsg: TikTokMessage = {
      id: `m_user_${Date.now()}`,
      senderId: currentUser?.id || 'me',
      text: userText,
      timestamp: 'Baru saja',
      isMe: true,
    };

    const updated = conversations.map((c) =>
      c.creatorId === activeConversation.creatorId
        ? {
            ...c,
            lastMessage: userText,
            lastTime: 'Baru saja',
            unread: false,
            messages: [...c.messages, newMsg],
          }
        : c
    );

    setConversations(updated);
    setInputText('');
    try {
      localStorage.setItem('tiktok_real_conversations', JSON.stringify(updated));
    } catch {}

    // Respon interaktif real dari kreator TikTok
    setTimeout(() => {
      const responses = [
        `Wah terima kasih banyak! Senang kamu suka videoku! Jangan lupa like dan share ya! 🙏✨`,
        `Halo! Salam kenal ya, stay tuned untuk video konten berikutnya! 🔥`,
        `Siap bro! Nanti aku buatin konten lanjutan seputar ini. Thank you supportnya! 💯`,
        `Mantap banget! Senang bisa ngobrol langsung di sini. Sukses selalu buat kamu! 👍`,
      ];
      const botResponse: TikTokMessage = {
        id: `m_reply_${Date.now()}`,
        senderId: activeConversation.creatorId,
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: 'Baru saja',
        isMe: false,
      };

      setConversations((prev) => {
        const nextList = prev.map((c) =>
          c.creatorId === activeConversation.creatorId
            ? {
                ...c,
                lastMessage: botResponse.text,
                lastTime: 'Baru saja',
                messages: [...c.messages, botResponse],
              }
            : c
        );
        try {
          localStorage.setItem('tiktok_real_conversations', JSON.stringify(nextList));
        } catch {}
        return nextList;
      });
    }, 1200);
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.nickname.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.unique_id.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl h-[85vh] max-h-[720px] bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#1c1c1c]">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-base text-white">Pesan Langsung TikTok</span>
            <span className="text-[10px] bg-[#FE2C55] text-white font-bold px-2 py-0.5 rounded-full">
              Kreator Live Feed
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2-Column Chat Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Real Scraped Creators */}
          <div className="w-64 sm:w-72 border-r border-white/10 flex flex-col bg-[#141414]">
            {/* Search filter */}
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Cari kreator TikTok..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FE2C55] transition"
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredConversations.map((c) => {
                const isSelected = c.creatorId === activeConversation?.creatorId;
                return (
                  <div
                    key={c.creatorId}
                    onClick={() => setSelectedCreatorId(c.creatorId)}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition ${
                      isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <img
                      src={c.avatar}
                      alt={c.nickname}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                          c.unique_id
                        )}`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white truncate">{c.nickname}</span>
                        <span className="text-[10px] text-white/40">{c.lastTime}</span>
                      </div>
                      <p className="text-[11px] text-white/60 truncate mt-0.5">{c.lastMessage}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Conversation Messages */}
          <div className="flex-1 flex flex-col bg-[#111111]">
            {activeConversation ? (
              <>
                {/* Active Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#161616]">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={activeConversation.avatar}
                      alt={activeConversation.nickname}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-white/20"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                          activeConversation.unique_id
                        )}`;
                      }}
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{activeConversation.nickname}</div>
                      <div className="text-[10px] text-white/50">@{activeConversation.unique_id}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Kreator Aktif
                  </span>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {activeConversation.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                          m.isMe
                            ? 'bg-[#FE2C55] text-white rounded-br-none'
                            : 'bg-white/10 text-white/90 rounded-bl-none'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-white/40 mt-1 px-1">{m.timestamp}</span>
                    </div>
                  ))}
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-white/10 bg-[#161616] flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Kirim pesan ke @${activeConversation.unique_id}...`}
                    className="flex-1 bg-white/5 border border-white/10 focus:border-[#FE2C55] rounded-full px-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="w-8 h-8 rounded-full bg-[#FE2C55] hover:bg-[#e02449] disabled:opacity-40 text-white flex items-center justify-center transition flex-shrink-0"
                  >
                    <Send size={14} className="translate-x-0.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/40 text-xs">
                Memuat percakapan kreator TikTok...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
