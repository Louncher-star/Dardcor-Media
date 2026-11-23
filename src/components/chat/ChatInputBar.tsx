'use client';

import { useState, useRef, useEffect } from 'react';
import { Ban, Smile, Plus, Send, Mic, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import { VoiceRecorder } from './VoiceRecorder';
import { AttachmentMenu } from './AttachmentMenu';
import { uploadChatMedia } from '@/lib/utils/mediaUtils';
import { playMessageSentSound } from '@/lib/utils/soundUtils';
import { appendMessage } from '@/lib/services/chatService';
import { Message } from '@/types';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';

interface ChatInputBarProps {
  chatId: string;
  onSendTyping: (isTyping: boolean) => void;
  onRequestFilePreview?: (file: File, type: 'image' | 'video' | 'audio' | 'document') => void;
}

export function ChatInputBar({ chatId, onSendTyping, onRequestFilePreview }: ChatInputBarProps) {
  const { user } = useAuthStore();
  const {
    replyingToMessage,
    setReplyingToMessage,
    addMessage,
    chats,
    theme,
    blockedUserIds,
    drafts,
    setDraft,
  } = useChatStore();

  const [text, setText] = useState(() => drafts[chatId] || '');
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const attachmentRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find((c) => c.id === chatId);
  const otherUserId = currentChat?.other_participant?.id;
  const isBlocked = Boolean(otherUserId && blockedUserIds.includes(otherUserId));

  const {
    isRecording,
    recordingDuration,
    audioLevels,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  // Click outside to close emoji picker & attachment menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(target)) {
        setIsEmojiPickerOpen(false);
      }
      if (attachmentRef.current && !attachmentRef.current.contains(target)) {
        setIsAttachmentOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendTextMessage = async () => {
    const content = text.trim();
    if (!content || !user) return;

    setText('');
    setDraft(chatId, '');
    onSendTyping(false);
    playMessageSentSound();

    const replyId = replyingToMessage?.id || null;
    const repliedMsg = replyingToMessage;
    setReplyingToMessage(null);

    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');
    const newMsg: Message = {
      id: tempId,
      chat_id: chatId,
      sender_id: user.id,
      content,
      message_type: 'text',
      reply_to_id: replyId,
      reply_to: repliedMsg,
      is_deleted_for_all: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: user,
    };

    addMessage(newMsg);
    await appendMessage(newMsg, user.id, otherUserId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendTextMessage();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    setDraft(chatId, value);
    onSendTyping(value.length > 0);
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setText((prev) => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  // Kirim Pesan Media (Foto, Video, Audio, Dokumen Apapun)
  const handleSelectMedia = async (file: File, type: 'image' | 'video' | 'audio' | 'document') => {
    if (onRequestFilePreview) {
      onRequestFilePreview(file, type);
      return;
    }

    if (!user) return;
    setIsUploadingMedia(true);

    try {
      const folderMap = {
        image: 'images' as const,
        video: 'videos' as const,
        audio: 'audios' as const,
        document: 'documents' as const,
      };

      const { url } = await uploadChatMedia(
        file,
        file.name,
        folderMap[type] || 'documents',
        undefined,
        user.id
      );
      playMessageSentSound();

      const mediaMsgId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');
      const newMsg: Message = {
        id: mediaMsgId,
        chat_id: chatId,
        sender_id: user.id,
        content: null,
        message_type: type,
        media_url: url,
        media_name: file.name,
        media_size: file.size,
        media_mime_type: file.type || 'application/octet-stream',
        is_deleted_for_all: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: user,
      };

      addMessage(newMsg);
      await appendMessage(newMsg, user.id, otherUserId);
    } catch (err) {
      console.error('Failed to upload and send media:', err);
      alert('Gagal mengirim media.');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Selesai Rekam Voice Note
  const handleSendVoiceNote = async () => {
    if (!user) return;
    setIsUploadingMedia(true);

    const recordingResult = await stopRecording();
    if (!recordingResult) {
      setIsUploadingMedia(false);
      return;
    }

    const { blob, duration } = recordingResult;

    try {
      const fileName = `voice_${Date.now()}.webm`;
      const { url } = await uploadChatMedia(blob, fileName, 'audios', undefined, user.id);
      playMessageSentSound();

      const voiceMsgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');
      const newMsg: Message = {
        id: voiceMsgId,
        chat_id: chatId,
        sender_id: user.id,
        content: null,
        message_type: 'audio',
        media_url: url,
        media_duration: duration,
        media_size: blob.size,
        media_mime_type: blob.type,
        is_deleted_for_all: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: user,
      };

      addMessage(newMsg);
      await appendMessage(newMsg, user.id, otherUserId);
    } catch (err) {
      console.error('Failed to send voice note:', err);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  if (isBlocked) {
    return (
      <footer className="bg-[var(--wa-header-bg)] border-t border-[var(--wa-border)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0 z-20">
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--wa-text-secondary)] text-center">
          <Ban size={15} className="text-red-400 shrink-0" />
          <span>
            Anda memblokir kontak ini. Buka blokir di Info Kontak untuk dapat mengirim pesan.
          </span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-[var(--wa-header-bg)] px-2 md:px-4 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] relative shrink-0 z-20">
      {/* Quoted Message Banner */}
      {replyingToMessage && (
        <div className="mb-2 p-2 bg-[var(--wa-bg-sidebar)] border-l-4 border-[#8b5cf6] rounded flex items-center justify-between shadow-sm">
          <div className="min-w-0 pr-2">
            <span className="font-semibold text-[#c084fc] block truncate">
              Membalas {replyingToMessage.sender?.display_name || 'pesan'}
            </span>
            <span className="text-[var(--wa-text-secondary)] block truncate">
              {replyingToMessage.content || 'Media'}
            </span>
          </div>
          <button
            onClick={() => setReplyingToMessage(null)}
            className="p-1 text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] rounded-full shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Mode Rekam Suara vs Mode Normal */}
      {isRecording ? (
        <VoiceRecorder
          duration={recordingDuration}
          levels={audioLevels}
          onCancel={cancelRecording}
          onSend={handleSendVoiceNote}
          isUploading={isUploadingMedia}
        />
      ) : (
        <div className="flex items-end gap-1 md:gap-1.5">
          {/* Emoji Picker Button */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEmojiPickerOpen(!isEmojiPickerOpen);
              }}
              title="Emoji"
              aria-label="Emoji"
              className="w-10 h-10 flex items-center justify-center text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] rounded-full hover:bg-[var(--wa-hover)] transition"
            >
              <Smile size={24} />
            </button>

            {isEmojiPickerOpen && (
              <div
                className="absolute bottom-14 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <EmojiPicker
                  theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                  onEmojiClick={handleEmojiClick}
                  width={340}
                  height={400}
                />
              </div>
            )}
          </div>

          {/* Attachment Button */}
          <div className="relative" ref={attachmentRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAttachmentOpen((prev) => !prev);
              }}
              title="Lampiran"
              aria-label="Lampiran"
              className="w-10 h-10 flex items-center justify-center text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] rounded-full hover:bg-[var(--wa-hover)] transition"
            >
              <Plus size={24} className={isAttachmentOpen ? 'rotate-45 transition-transform' : 'transition-transform'} />
            </button>

            <AttachmentMenu
              isOpen={isAttachmentOpen}
              onClose={() => setIsAttachmentOpen(false)}
              onSelectMedia={handleSelectMedia}
            />
          </div>

          {/* Text Input Area */}
          <div className="flex-1 min-w-0 bg-[var(--wa-bg-sidebar)] rounded-lg flex items-center px-3 py-1 min-h-[40px]">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan"
              aria-label="Ketik pesan"
              className="wa-composer-input w-full bg-transparent text-[14.5px] text-[var(--wa-text-primary)] placeholder:text-[var(--wa-text-secondary)] resize-none focus:outline-none max-h-28 py-2 leading-5"
            />
          </div>

          {/* Right Button: Send or Microphone */}
          {text.trim().length > 0 ? (
            <button
              type="button"
              onClick={handleSendTextMessage}
              title="Kirim"
              aria-label="Kirim pesan"
              className="w-10 h-10 rounded-full bg-[var(--wa-teal)] hover:bg-[var(--wa-teal-hover)] text-white flex items-center justify-center shadow-sm transition shrink-0"
            >
              <Send size={19} />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              title="Rekam pesan suara"
              aria-label="Rekam pesan suara"
              className="w-10 h-10 flex items-center justify-center text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] rounded-full hover:bg-[var(--wa-hover)] transition shrink-0"
            >
              <Mic size={23} />
            </button>
          )}
        </div>
      )}
    </footer>
  );
}
