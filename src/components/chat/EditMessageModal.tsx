'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Edit3 } from 'lucide-react';
import { Message } from '@/types';
import { editMessage } from '@/lib/services/chatService';
import { useChatStore } from '@/lib/store/useChatStore';

interface EditMessageModalProps {
  isOpen: boolean;
  message: Message | null;
  onClose: () => void;
}

export function EditMessageModal({ isOpen, message, onClose }: EditMessageModalProps) {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { updateMessage } = useChatStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (message?.content) {
      setContent(message.content);
    }
  }, [message]);

  if (!isOpen || !mounted || !message) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || trimmed === message.content) {
      onClose();
      return;
    }

    setIsSaving(true);
    const editedAt = new Date().toISOString();
    try {
      updateMessage(message.chat_id, message.id, {
        content: trimmed,
        is_edited: true,
        edited_at: editedAt,
      });
      await editMessage(message.chat_id, message.id, trimmed);
      onClose();
    } catch (err) {
      console.error('Error saving edited message:', err);
      alert('Gagal menyimpan perubahan pesan.');
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[var(--wa-bg-sidebar)] border border-[var(--wa-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-14 px-4 bg-[var(--wa-header-bg)] border-b border-[var(--wa-border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center">
              <Edit3 size={17} />
            </div>
            <h3 className="font-semibold text-base text-[var(--wa-text-primary)]">
              Edit Pesan
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] transition"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-3">
          <div className="space-y-1">
            <textarea
              autoFocus
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ketik teks baru..."
              className="w-full p-3 rounded-xl bg-[var(--wa-header-bg)] border border-[var(--wa-border)] text-sm text-[var(--wa-text-primary)] placeholder:text-[var(--wa-text-secondary)] focus:outline-none focus:border-[#00a884] transition resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] text-[var(--wa-text-secondary)] px-1">
              <span>Hanya dapat diedit dalam 15 menit pertama.</span>
              <span>{content.length} karakter</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--wa-border)]/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--wa-text-secondary)] hover:bg-[var(--wa-hover)] transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving || !content.trim() || content.trim() === message.content}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#00a884] hover:bg-[#06cf9c] transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Check size={16} />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
