'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { EmptyChatState } from './EmptyChatState';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInputBar } from './ChatInputBar';
import { FilePreviewModal } from './FilePreviewModal';
import { MediaLightboxModal } from './MediaLightboxModal';
import { ChatInfoDrawer } from './ChatInfoDrawer';
import { ChatSearchBar } from './ChatSearchBar';
import { ForwardMessageModal } from './ForwardMessageModal';
import { StarredMessagesDrawer } from './StarredMessagesDrawer';
import { CreatePollModal } from './CreatePollModal';
import { usePresence } from '@/lib/hooks/usePresence';
import {
  fetchChatMessages,
  fetchUserChats,
  subscribeToLocalSync,
  appendMessage,
} from '@/lib/services/chatService';
import { uploadChatMedia } from '@/lib/utils/mediaUtils';
import { playMessageSentSound } from '@/lib/utils/soundUtils';
import { Message, PollData } from '@/types';
import { UploadCloud } from 'lucide-react';

export function ChatArea() {
  const { user } = useAuthStore();
  const { chats, setChats, activeChatId, setActiveChatId, messages, setMessages, addMessage } =
    useChatStore();

  const activeChat = chats.find((c) => c.id === activeChatId);

  // Presence hook for typing signal
  const { sendTypingSignal } = usePresence(activeChatId);

  // States untuk File Upload Preview & Drag-and-Drop
  const [previewFile, setPreviewFile] = useState<{
    file: File;
    type: 'image' | 'video' | 'audio' | 'document';
  } | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Panel & pencarian ala WhatsApp
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const [isStarredOpen, setIsStarredOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);

  // Acuan waktu untuk menyaring pesan sementara; Date.now() tidak boleh dipanggil saat render
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(interval);
  }, []);

  // Fetch messages saat chat aktif berubah
  const currentUserId = user?.id;
  useEffect(() => {
    if (!activeChatId) return;

    const currentChats = useChatStore.getState().chats;
    if (!currentChats.some((c) => c.id === activeChatId) && currentUserId) {
      fetchUserChats(currentUserId).then((fresh) => {
        setChats(fresh);
      });
    }

    const loadMessages = async () => {
      const msgs = await fetchChatMessages(activeChatId, currentUserId);
      setMessages(activeChatId, msgs);
    };

    loadMessages();

    // Dengarkan pembaruan pesan dari tab lain
    const unsubscribe = subscribeToLocalSync((event) => {
      if (event.type === 'MESSAGES_UPDATED') {
        const payload = event.payload as { chatId: string };
        if (payload.chatId === activeChatId) {
          loadMessages();
        }
      }
    });

    return () => unsubscribe();
  }, [activeChatId, setMessages, setChats, currentUserId]);

  // Handler kirim file dengan keterangan (caption) dari modal preview
  const handleSendMediaWithCaption = async (
    file: File,
    type: 'image' | 'video' | 'audio' | 'document',
    caption: string
  ) => {
    if (!user || !activeChat) return;
    setIsUploadingMedia(true);
    setUploadStatus(
      file.size > 40 * 1024 * 1024
        ? 'Menyiapkan berkas besar...'
        : 'Mengunggah file...'
    );

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
        (progress) => {
          if (progress.totalParts > 1) {
            setUploadStatus(
              `Mengunggah bagian ${progress.currentPart}/${progress.totalParts} (${progress.percent}%)...`
            );
          } else {
            setUploadStatus('Mengunggah ke penyimpanan...');
          }
        },
        user.id
      );
      playMessageSentSound();

      const mediaMsgId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');

      const otherUserId = activeChat.other_participant?.id;

      const newMsg: Message = {
        id: mediaMsgId,
        chat_id: activeChat.id,
        sender_id: user.id,
        content: caption || null,
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
      setPreviewFile(null);
    } catch (err: unknown) {
      console.error('Failed to upload and send file:', err);
      const errMsg = err instanceof Error ? err.message : 'Pastikan koneksi dan Supabase aktif.';
      alert('Gagal mengunggah file: ' + errMsg);
    } finally {
      setIsUploadingMedia(false);
      setUploadStatus('');
    }
  };

  // Helper resolusi tipe file
  const resolveFileType = (file: File): 'image' | 'video' | 'audio' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name))
      return 'audio';
    return 'document';
  };

  // Handler kirim Polling WhatsApp Interaktif
  const handleCreatePoll = async (pollData: PollData) => {
    if (!user || !activeChat) return;
    playMessageSentSound();

    const pollMsgId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');

    const otherUserId = activeChat.other_participant?.id;

    const newMsg: Message = {
      id: pollMsgId,
      chat_id: activeChat.id,
      sender_id: user.id,
      content: JSON.stringify(pollData),
      message_type: 'poll',
      poll_data: pollData,
      is_deleted_for_all: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: user,
    };

    addMessage(newMsg);
    await appendMessage(newMsg, user.id, otherUserId);
  };

  // Drag & Drop Handlers ala WhatsApp Web
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Cegah flicker saat melewati anak elemen
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const type = resolveFileType(file);
      setPreviewFile({ file, type });
    }
  };

  // Dukungan Paste File / Screenshot (Ctrl + V) ala WhatsApp Web
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!activeChatId) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            const type = resolveFileType(file);
            setPreviewFile({ file, type });
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeChatId]);

  if (!activeChatId || !activeChat) {
    return (
      <main className="hidden md:flex flex-1 h-full">
        <EmptyChatState />
      </main>
    );
  }

  const ttlSeconds = activeChat.disappearing_seconds || 0;
  const currentMessages = (messages[activeChatId] || []).filter(
    (message) =>
      ttlSeconds === 0 ||
      now - new Date(message.created_at).getTime() < ttlSeconds * 1000
  );
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchResults = normalizedQuery
    ? currentMessages.filter(
        (msg) =>
          !msg.is_deleted_for_all &&
          ((msg.content || '').toLowerCase().includes(normalizedQuery) ||
            (msg.media_name || '').toLowerCase().includes(normalizedQuery))
      )
    : [];
  const isFiltering = isSearchOpen && normalizedQuery.length > 0;
  const visibleMessages = isFiltering ? searchResults : currentMessages;
  const safeSearchIndex = searchResults.length
    ? Math.min(searchIndex, searchResults.length - 1)
    : 0;
  const activeMessageId = isFiltering && searchResults.length
    ? searchResults[safeSearchIndex].id
    : null;

  return (
    <main
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 h-full flex flex-col bg-[var(--wa-chat-bg)] wa-chat-wallpaper relative overflow-hidden z-10 select-none"
    >
      {/* WhatsApp Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-[#0c0a14]/85 backdrop-blur-sm border-4 border-dashed border-[#8b5cf6] flex flex-col items-center justify-center p-6 text-white text-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="w-20 h-20 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#a78bfa] mb-4 shadow-2xl animate-bounce">
            <UploadCloud size={42} />
          </div>
          <h3 className="text-xl font-bold tracking-wide">Lepaskan file di sini untuk mengirim</h3>
          <p className="text-sm text-white/60 mt-1 max-w-sm">
            Kirim dokumen, zip, apk, foto, video, audio, atau file apa saja ke obrolan ini
          </p>
        </div>
      )}

      {/* Header */}
      <ChatHeader
        chat={activeChat}
        onBack={() => setActiveChatId(null)}
        onOpenInfo={() => setIsInfoOpen(true)}
        onToggleSearch={() => {
          setIsSearchOpen((prev) => !prev);
          setSearchQuery('');
          setSearchIndex(0);
        }}
        onOpenStarred={() => setIsStarredOpen(true)}
      />

      {isSearchOpen && (
        <ChatSearchBar
          query={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            setSearchIndex(0);
          }}
          onClose={() => {
            setIsSearchOpen(false);
            setSearchQuery('');
          }}
          resultCount={searchResults.length}
          activeIndex={safeSearchIndex}
          onNext={() =>
            setSearchIndex((prev) =>
              searchResults.length ? (prev + 1) % searchResults.length : 0
            )
          }
          onPrev={() =>
            setSearchIndex((prev) =>
              searchResults.length
                ? (prev - 1 + searchResults.length) % searchResults.length
                : 0
            )
          }
        />
      )}

      {/* Message Canvas */}
      <MessageList
        messages={visibleMessages}
        isGroup={activeChat.is_group}
        searchQuery={isSearchOpen ? searchQuery : ''}
        activeMessageId={activeMessageId}
        onForward={(msg) => setForwardMessage(msg)}
      />

      {/* Input Bar */}
      <ChatInputBar
        chatId={activeChat.id}
        onSendTyping={sendTypingSignal}
        onRequestFilePreview={(file, type) => setPreviewFile({ file, type })}
        onOpenPoll={() => setIsCreatePollOpen(true)}
      />

      {/* WhatsApp Create Poll Modal */}
      <CreatePollModal
        isOpen={isCreatePollOpen}
        onClose={() => setIsCreatePollOpen(false)}
        onCreatePoll={handleCreatePoll}
      />

      {/* WhatsApp Media Preview & Caption Modal */}
      <FilePreviewModal
        key={
          previewFile
            ? `${previewFile.file.name}-${previewFile.file.size}-${previewFile.file.lastModified}`
            : 'empty'
        }
        isOpen={Boolean(previewFile)}
        file={previewFile?.file || null}
        fileType={previewFile?.type || 'document'}
        isUploading={isUploadingMedia}
        uploadStatus={uploadStatus}
        onClose={() => setPreviewFile(null)}
        onSend={handleSendMediaWithCaption}
      />

      {/* WhatsApp Fullscreen Media Lightbox Viewer */}
      <MediaLightboxModal />

      {/* Panel info kontak/grup */}
      {isInfoOpen && (
        <ChatInfoDrawer
          chat={activeChat}
          isOpen
          onClose={() => setIsInfoOpen(false)}
          onOpenStarred={() => setIsStarredOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      )}

      {/* Daftar pesan berbintang */}
      <StarredMessagesDrawer
        chatId={activeChat.id}
        isOpen={isStarredOpen}
        onClose={() => setIsStarredOpen(false)}
      />

      {/* Teruskan pesan */}
      {forwardMessage && (
        <ForwardMessageModal
          isOpen
          message={forwardMessage}
          onClose={() => setForwardMessage(null)}
        />
      )}
    </main>
  );
}
