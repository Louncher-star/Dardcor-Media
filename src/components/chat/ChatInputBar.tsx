'use client';

import { useState, useRef, useEffect } from 'react';
import { Smile, Plus, Send, Mic, X } from 'lucide-react';
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
}

export function ChatInputBar({ chatId, onSendTyping }: ChatInputBarProps) {
  const { user } = useAuthStore();
  const {
    replyingToMessage,
    setReplyingToMessage,
    addMessage,
    chats,
    theme,
  } = useChatStore();

  const [text, setText] = useState('');
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find((c) => c.id === chatId);
  const otherUserId = currentChat?.other_participant?.id;

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
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
      setIsAttachmentOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendTextMessage = async () => {
    const content = text.trim();
    if (!content || !user) return;

    setText('');
    onSendTyping(false);
    playMessageSentSound();

    const replyId = replyingToMessage?.id || null;
    const repliedMsg = replyingToMessage;
    setReplyingToMessage(null);

    const tempId = `msg_${Date.now()}`;
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
    setText(e.target.value);
    onSendTyping(e.target.value.length > 0);
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setText((prev) => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  // Kirim Pesan Media (Foto, Video, Dokumen)
  const handleSelectMedia = async (file: File, type: 'image' | 'video' | 'document') => {
    if (!user) return;
    setIsUploadingMedia(true);

    try {
      const folderMap = {
        image: 'images' as const,
        video: 'videos' as const,
        document: 'documents' as const,
      };

      const { url } = await uploadChatMedia(file, file.name, folderMap[type]);
      playMessageSentSound();

      const newMsg: Message = {
        id: `msg_${Date.now()}`,
        chat_id: chatId,
        sender_id: user.id,
        content: null,
        message_type: type,
        media_url: url,
        media_name: file.name,
        media_size: file.size,
        media_mime_type: file.type,
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
      const { url } = await uploadChatMedia(blob, fileName, 'audios');
      playMessageSentSound();

      const newMsg: Message = {
        id: `msg_${Date.now()}`,
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

  return (
    <footer className="bg-[var(--wa-header-bg)] border-t border-[var(--wa-border)] p-2 relative shrink-0 z-20">
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
        <div className="flex items-end gap-2">
          {/* Emoji Picker Button */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEmojiPickerOpen(!isEmojiPickerOpen);
              }}
              title="Emoji"
              className="p-2.5 text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] rounded-full hover:bg-[var(--wa-hover)] transition"
            >
              <Smile size={22} />
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
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAttachmentOpen(!isAttachmentOpen);
              }}
              title="Lampiran"
              className="p-2.5 text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] rounded-full hover:bg-[var(--wa-hover)] transition"
            >
              <Plus size={22} className={isAttachmentOpen ? 'rotate-45 transition-transform' : 'transition-transform'} />
            </button>

            <AttachmentMenu
              isOpen={isAttachmentOpen}
              onClose={() => setIsAttachmentOpen(false)}
              onSelectMedia={handleSelectMedia}
            />
          </div>

          {/* Text Input Area */}
          <div className="flex-1 min-w-0 bg-[var(--wa-bg-sidebar)] rounded-lg border border-[var(--wa-border)] flex items-center px-3 py-1">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan"
              className="w-full bg-transparent text-sm text-[var(--wa-text-primary)] placeholder:text-[var(--wa-text-secondary)]/70 resize-none focus:outline-none max-h-32 py-1.5 leading-5"
            />
          </div>

          {/* Right Button: Send or Microphone */}
          {text.trim().length > 0 ? (
            <button
              type="button"
              onClick={handleSendTextMessage}
              title="Kirim"
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#9333ea] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white flex items-center justify-center shadow-md shadow-purple-900/30 transition shrink-0"
            >
              <Send size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              title="Rekam Pesan Suara"
              className="p-2.5 text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] rounded-full hover:bg-[var(--wa-hover)] transition shrink-0"
            >
              <Mic size={22} />
            </button>
          )}
        </div>
      )}
    </footer>
  );
}
