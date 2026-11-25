'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Lock,
  Unlock,
  X,
  Delete,
  ShieldAlert,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Chat } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { updateChatPrefs } from '@/lib/services/chatService';
import { formatChatListTime } from '@/lib/utils/dateUtils';

interface LockedChatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
}

const PIN_STORAGE_KEY = 'dardcor_chat_lock_pin';

export function LockedChatsModal({
  isOpen,
  onClose,
  onSelectChat,
}: LockedChatsModalProps) {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();
  const { chats, updateChat } = useChatStore();

  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const pin = localStorage.getItem(PIN_STORAGE_KEY);
      setStoredPin(pin);
      if (!pin) {
        setIsSettingPin(true);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPinInput('');
      setConfirmPinInput('');
      setErrorMessage('');
      setIsUnlocked(false);
    }
  }, [isOpen]);

  const lockedChats = chats.filter((c) => c.is_locked);

  const handleKeyPress = (num: string) => {
    setErrorMessage('');
    if (pinInput.length < 4) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);

      if (nextPin.length === 4) {
        if (isSettingPin) {
          // Menunggu konfirmasi PIN baru
        } else {
          // Verifikasi PIN yang ada
          if (nextPin === storedPin) {
            setIsUnlocked(true);
            setPinInput('');
          } else {
            triggerError('PIN salah. Coba lagi.');
          }
        }
      }
    }
  };

  const handleConfirmNewPin = () => {
    if (pinInput.length !== 4) {
      triggerError('PIN harus berupa 4 angka.');
      return;
    }
    if (confirmPinInput !== pinInput) {
      triggerError('Konfirmasi PIN tidak cocok.');
      setConfirmPinInput('');
      return;
    }

    localStorage.setItem(PIN_STORAGE_KEY, pinInput);
    setStoredPin(pinInput);
    setIsSettingPin(false);
    setIsUnlocked(true);
    setPinInput('');
    setConfirmPinInput('');
  };

  const handleDeleteDigit = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setPinInput('');
    }, 500);
  };

  const handleUnlockChat = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    updateChat(chat.id, { is_locked: false });
    if (user) {
      updateChatPrefs(chat.id, user.id, { is_locked: false });
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#161224] border border-purple-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#6d28d9] to-[#4f46e5] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <Lock size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">Obrolan Terkunci</h3>
              <p className="text-[10px] text-white/70">Aman & Terenkripsi Rahasia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content: Masukkan PIN / Buat PIN / Daftar Obrolan Terkunci */}
        <div className="p-5 flex-1 flex flex-col items-center">
          {!isUnlocked ? (
            <div className="w-full flex flex-col items-center">
              {isSettingPin ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-purple-500/15 text-[#c084fc] flex items-center justify-center mb-3">
                    <ShieldCheck size={26} />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Buat PIN Keamanan Obrolan
                  </h4>
                  <p className="text-xs text-white/60 text-center mb-4 max-w-[240px]">
                    Atur 4-angka PIN untuk melindungi obrolan rahasia Anda.
                  </p>

                  {pinInput.length === 4 ? (
                    <div className="w-full mb-3 flex flex-col items-center">
                      <span className="text-xs text-purple-300 font-medium mb-1">
                        Masukkan kembali PIN:
                      </span>
                      <input
                        type="password"
                        maxLength={4}
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-24 text-center tracking-[0.5em] text-lg font-bold bg-[#0d0b14] border border-purple-500/30 rounded-xl py-1.5 text-white focus:outline-none focus:border-purple-400"
                      />
                      <button
                        onClick={handleConfirmNewPin}
                        disabled={confirmPinInput.length !== 4}
                        className="mt-3 px-5 py-1.5 rounded-full bg-[#7c3aed] text-white text-xs font-semibold hover:bg-[#6d28d9] disabled:opacity-40 transition"
                      >
                        Simpan PIN
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-purple-500/15 text-[#c084fc] flex items-center justify-center mb-3">
                    <Lock size={26} />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Masukkan PIN Obrolan
                  </h4>
                  <p className="text-xs text-white/60 text-center mb-4">
                    Ketik 4-digit PIN Anda untuk membuka obrolan terkunci
                  </p>
                </>
              )}

              {/* Dot Indicators */}
              <div
                className={`flex items-center gap-3 my-2 ${
                  shake ? 'animate-bounce text-red-400' : ''
                }`}
              >
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      pinInput.length > index
                        ? 'bg-[#a855f7] border-[#c084fc] scale-110 shadow-lg shadow-purple-900/50'
                        : 'border-white/30 bg-transparent'
                    }`}
                  />
                ))}
              </div>

              {errorMessage && (
                <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                  <ShieldAlert size={14} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] mt-5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(String(num))}
                    className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-white font-bold text-base transition flex items-center justify-center border border-white/5 hover:border-purple-500/20"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-white font-bold text-base transition flex items-center justify-center border border-white/5 hover:border-purple-500/20"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleDeleteDigit}
                  className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-white/80 transition flex items-center justify-center border border-white/5"
                  title="Hapus"
                >
                  <Delete size={20} />
                </button>
              </div>
            </div>
          ) : (
            /* Daftar Obrolan Terkunci Setelah Berhasil Dibuka */
            <div className="w-full flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
                <span className="text-xs font-semibold text-purple-300">
                  {lockedChats.length} Obrolan Terkunci
                </span>
                <button
                  onClick={() => setIsUnlocked(false)}
                  className="text-[11px] text-white/60 hover:text-white transition flex items-center gap-1"
                >
                  <Lock size={12} />
                  <span>Kunci Kembali</span>
                </button>
              </div>

              {lockedChats.length === 0 ? (
                <div className="py-10 text-center text-white/50 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                    <Unlock size={22} className="text-white/40" />
                  </div>
                  <p className="text-xs">Belum ada obrolan yang dikunci.</p>
                  <p className="text-[11px] text-white/40 mt-1 max-w-[200px]">
                    Klik titik tiga pada obrolan di daftar obrolan, lalu pilih &quot;Kunci Obrolan&quot;.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[300px]">
                  {lockedChats.map((chat) => {
                    const otherUser = chat.other_participant;
                    const name = chat.is_group
                      ? chat.group_name || 'Grup'
                      : otherUser?.display_name || otherUser?.username || 'Kontak';
                    const avatar = chat.is_group ? chat.group_avatar_url : otherUser?.avatar_url;

                    return (
                      <div
                        key={chat.id}
                        onClick={() => {
                          onSelectChat(chat.id);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition flex items-center gap-3 cursor-pointer border border-white/5"
                      >
                        <Avatar src={avatar} name={name} size="md" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate">{name}</h4>
                          <p className="text-[11px] text-white/60 truncate">
                            {chat.last_message?.content || 'Belum ada pesan'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleUnlockChat(chat, e)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition"
                            title="Buka Kunci Obrolan"
                          >
                            <Unlock size={14} />
                          </button>
                          <ChevronRight size={16} className="text-white/40" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
