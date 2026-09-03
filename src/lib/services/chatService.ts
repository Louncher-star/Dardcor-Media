import { Chat, Message, Profile } from '@/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

const CHATS_PREFIX = 'dardcor_chats_';
const MESSAGES_PREFIX = 'dardcor_messages_';

// Sync channel antar tab browser
let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  syncChannel = new BroadcastChannel('dardcor_sync_channel');
}

export function subscribeToLocalSync(onSync: (event: { type: string; payload: unknown }) => void) {
  if (!syncChannel) return () => {};
  const handler = (e: MessageEvent) => {
    if (e.data) onSync(e.data);
  };
  syncChannel.addEventListener('message', handler);
  return () => syncChannel?.removeEventListener('message', handler);
}

export function broadcastLocalSync(type: string, payload: unknown) {
  if (syncChannel) {
    syncChannel.postMessage({ type, payload });
  }
}

// 1. Ambil daftar chat milik user
export async function fetchUserChats(userId: string): Promise<Chat[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: participantsData } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          chat:chats!chat_id (
            id,
            is_group,
            group_name,
            group_description,
            group_avatar_url,
            created_by,
            last_message_at,
            created_at,
            updated_at,
            participants:chat_participants (
              id,
              chat_id,
              user_id,
              role,
              is_pinned,
              is_archived,
              is_muted,
              last_read_at,
              joined_at,
              profile:profiles!user_id (*)
            )
          )
        `)
        .eq('user_id', userId);

      if (participantsData && participantsData.length > 0) {
        const loadedChats: Chat[] = participantsData
          .map((item) => {
            const rawChat = item.chat as unknown as Chat;
            if (!rawChat) return null;

            let otherParticipant = undefined;
            if (!rawChat.is_group && rawChat.participants) {
              const other = rawChat.participants.find((p) => p.user_id !== userId);
              otherParticipant = other?.profile;
            }

            return {
              ...rawChat,
              other_participant: otherParticipant,
            };
          })
          .filter(Boolean) as Chat[];

        // Ambil pesan terakhir untuk setiap chat dari database Supabase
        if (loadedChats.length > 0) {
          const chatIds = loadedChats.map((c) => c.id);
          const { data: latestMessages } = await supabase
            .from('messages')
            .select('*')
            .in('chat_id', chatIds)
            .order('created_at', { ascending: false });

          if (latestMessages && latestMessages.length > 0) {
            for (const chat of loadedChats) {
              const latest = latestMessages.find((m) => m.chat_id === chat.id);
              if (latest) {
                chat.last_message = latest as Message;
                chat.last_message_at = latest.created_at;
              }
            }
          }
        }

        loadedChats.sort(
          (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );
        return loadedChats;
      }
      return [];
    } catch (err) {
      console.error('Error fetching chats from Supabase:', err);
    }
  }

  // Local Storage
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${CHATS_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// 2. Simpan daftar chat user (Local Storage)
export function saveUserChats(userId: string, chats: Chat[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${CHATS_PREFIX}${userId}`, JSON.stringify(chats));
  broadcastLocalSync('CHATS_UPDATED', { userId, chats });
}

// 3. Ambil pesan dalam suatu chat
export async function fetchChatMessages(chatId: string): Promise<Message[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: messagesData } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id (*),
          reply_to:messages!reply_to_id (*, sender:profiles!sender_id (*)),
          reactions:message_reactions (*),
          statuses:message_statuses (*)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesData) {
        return messagesData as unknown as Message[];
      }
    } catch (err) {
      console.error('Error fetching messages from Supabase:', err);
    }
  }

  // Local Storage
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${MESSAGES_PREFIX}${chatId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// 4. Simpan pesan dalam chat (Local Storage)
export function saveChatMessages(chatId: string, messages: Message[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${MESSAGES_PREFIX}${chatId}`, JSON.stringify(messages));
  broadcastLocalSync('MESSAGES_UPDATED', { chatId, messages });
}

// 5. Tambah pesan baru
export async function appendMessage(message: Message, currentUserId: string, otherUserId?: string) {
  if (isSupabaseConfigured()) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (isUuid.test(message.chat_id)) {
        const supabase = createClient();

        // A. Pastikan chat_id sudah terdaftar di tabel chats di cloud database Supabase
        const { data: existingChat } = await supabase
          .from('chats')
          .select('id')
          .eq('id', message.chat_id)
          .maybeSingle();

        if (!existingChat) {
          await supabase.from('chats').upsert({
            id: message.chat_id,
            is_group: false,
            created_by: currentUserId,
            last_message_at: message.created_at,
          });

          // Daftarkan kedua pengguna ke chat_participants
          const participantsList = [{ chat_id: message.chat_id, user_id: currentUserId }];
          if (otherUserId && otherUserId !== currentUserId && isUuid.test(otherUserId)) {
            participantsList.push({ chat_id: message.chat_id, user_id: otherUserId });
          }
          await supabase.from('chat_participants').upsert(participantsList);
        }

        // B. Simpan pesan ke tabel messages
        const safeMessageId = isUuid.test(message.id)
          ? message.id
          : typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');

        const safeReplyId =
          message.reply_to_id && isUuid.test(message.reply_to_id) ? message.reply_to_id : null;

        await supabase.from('messages').insert({
          id: safeMessageId,
          chat_id: message.chat_id,
          sender_id: message.sender_id,
          content: message.content,
          message_type: message.message_type,
          media_url: message.media_url,
          media_name: message.media_name,
          media_size: message.media_size,
          media_duration: message.media_duration,
          reply_to_id: safeReplyId,
        });

        // C. Perbarui waktu pesan terakhir di chat
        await supabase
          .from('chats')
          .update({ last_message_at: message.created_at })
          .eq('id', message.chat_id);

        // D. Broadcast via Supabase Realtime Channel untuk pengiriman instan multi-device
        const broadcastChannel = supabase.channel('dardcor_chat_broadcast');
        broadcastChannel.send({
          type: 'broadcast',
          event: 'NEW_MESSAGE',
          payload: message,
        });
      }
    } catch (err) {
      console.error('Error saving message to Supabase:', err);
    }
  }

  // Local Storage Logic: Simpan pesan di chatId
  const existingMessages = await fetchChatMessages(message.chat_id);
  const updated = [...existingMessages, message];
  saveChatMessages(message.chat_id, updated);

  // Update last_message pada daftar chat pengirim
  const userChats = await fetchUserChats(currentUserId);
  const chatIndex = userChats.findIndex((c) => c.id === message.chat_id);
  if (chatIndex !== -1) {
    userChats[chatIndex].last_message = message;
    userChats[chatIndex].last_message_at = message.created_at;
    userChats.sort(
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );
    saveUserChats(currentUserId, userChats);
  }

  // Jika ada penerima, update juga daftar chat penerima
  if (otherUserId && otherUserId !== currentUserId) {
    const receiverChats = await fetchUserChats(otherUserId);
    const rIdx = receiverChats.findIndex((c) => c.id === message.chat_id);
    if (rIdx !== -1) {
      receiverChats[rIdx].last_message = message;
      receiverChats[rIdx].last_message_at = message.created_at;
      receiverChats[rIdx].unread_count = (receiverChats[rIdx].unread_count || 0) + 1;
      saveUserChats(otherUserId, receiverChats);
    }
  }
}
