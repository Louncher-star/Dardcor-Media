'use client';

import { useState } from 'react';
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
  // Extract creators from feed to populate real TikTok friends / creators list
  const initialCreators = Array.from(
    new Map(
      feedVideos.map((v) => [
        v.author.id || v.author.unique_id,
        {
          creatorId: v.author.id || v.author.unique_id,
          unique_id: v.author.unique_id,
          nickname: v.author.nickname,
          avatar: v.author.avatar,
        },
      ])
    ).values()
  );

  const [conversations, setConversations] = useState<TikTokConversation[]>([
    {
      creatorId: 'c1',
      unique_id: 'lipxzz_melonzz',
      nickname: '—Lipxzź Dé Mélonzz',
      avatar: 'https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/default.jpeg',
      lastMessage: 'Halo bro! Keren banget videonya 🔥',
      lastTime: '12:40',
      unread: true,
      messages: [
        {
          id: 'm1',
          senderId: 'c1',
          text: 'Halo bro! Keren banget videonya 🔥',
          timestamp: '12:40',
          isMe: false,
        },
        {
          id: 'm2',
          senderId: 'me',
          text: 'Thanks man! Jangan lupa mampir lagi ya!',
          timestamp: '12:42',
          isMe: true,
        },
      ],
    },
    {
      creatorId: 'c2',
      unique_id: 'jokerded16',
      nickname: 'JOKER DZ',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=joker',
      lastMessage: 'Mantap kontennya!',
      lastTime: 'Kemarin',
      unread: false,
      messages: [
        {
          id: 'm3',
          senderId: 'c2',
          text: 'Mantap kontennya!',
          timestamp: 'Kemarin',
          isMe: false,
        },
      ],
    },
    {
      creatorId: 'c3',
      unique_id: 'zarr_creator',
      nickname: 'ZARR',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=zarr',
      lastMessage: 'Collab yuk kapan-kapan?',
      lastTime: '2 hari lalu',
      unread: false,
      messages: [
        {
          id: 'm4',
          senderId: 'c3',
          text: 'Collab yuk kapan-kapan?',
          timestamp: '2 hari lalu',
          isMe: false,
        },
      ],
    },
  ]);

  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('c1');
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const activeConversation = conversations.find((c) => c.creatorId === selectedCreatorId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedCreatorId) return;

    const newMsg: TikTokMessage = {
      id: `m_${Date.now()}`,
      senderId: currentUser?.id || 'me',
      text: inputText.trim(),
      timestamp: 'Baru saja',
      isMe: true,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.creatorId === selectedCreatorId
          ? {
              ...c,
              lastMessage: newMsg.text,
              lastTime: 'Baru saja',
              unread: false,
              messages: [...c.messages, newMsg],
            }
          : c
      )
    );

    setInputText('');
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.nickname.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.unique_id.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl h-[85vh] max-h-[720px] bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#1c1c1c]">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-base text-white">Pesan Langsung TikTok</span>
            <span className="text-[10px] bg-[#FE2C55]/20 text-[#FE2C55] font-bold px-2 py-0.5 rounded-full">
              TikTok DMs
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
          {/* Left Column: Friends List */}
          <div className="w-64 sm:w-72 border-r border-white/10 flex flex-col bg-[#141414]">
            {/* Search filter */}
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Cari teman TikTok..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FE2C55] transition"
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredConversations.map((c) => {
                const isSelected = c.creatorId === selectedCreatorId;
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
                      className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
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
                      className="w-8 h-8 rounded-full object-cover border border-white/20"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{activeConversation.nickname}</div>
                      <div className="text-[10px] text-white/50">@{activeConversation.unique_id}</div>
                    </div>
                  </div>
                  <button className="p-1 rounded-lg text-white/50 hover:text-white transition">
                    <MoreVertical size={16} />
                  </button>
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
                    placeholder="Kirim pesan langsung ke kreator TikTok..."
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
                Pilih teman TikTok untuk mulai berkirim pesan langsung.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
