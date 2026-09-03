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

      // A. Ambil chat_id di mana user ini menjadi partisipan
      const { data: myParticipations, error: pError } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('user_id', userId);

      if (pError) {
        console.error('Error fetching chat_participants from Supabase:', pError);
      }

      if (myParticipations && myParticipations.length > 0) {
        const chatIds = myParticipations.map((p) => p.chat_id);

        // B. Ambil data chats
        const { data: chatsData } = await supabase
          .from('chats')
          .select('*')
          .in('id', chatIds);

        if (chatsData && chatsData.length > 0) {
          // C. Ambil seluruh partisipan untuk chat-chat tersebut
          const { data: allParticipants } = await supabase
            .from('chat_participants')
            .select('*')
            .in('chat_id', chatIds);

          // D. Ambil profil seluruh user yang terlibat
          const userIds = [
            ...new Set((allParticipants || []).map((p) => p.user_id).filter(Boolean)),
          ];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

          const profileMap = new Map((profiles || []).map((p) => [p.id, p as Profile]));

          // E. Ambil pesan terakhir untuk tiap chat
          const { data: latestMessages } = await supabase
            .from('messages')
            .select('*')
            .in('chat_id', chatIds)
            .order('created_at', { ascending: false });

          // F. Gabungkan menjadi struktur Chat yang lengkap & teratur
          const loadedChats: Chat[] = chatsData.map((chat) => {
            const chatPartis = (allParticipants || []).filter((p) => p.chat_id === chat.id);
            const enrichedParticipants = chatPartis.map((p) => ({
              ...p,
              profile: profileMap.get(p.user_id),
            }));

            let otherParticipant = undefined;
            if (!chat.is_group) {
              const other = chatPartis.find((p) => p.user_id !== userId);
              if (other) {
                otherParticipant = profileMap.get(other.user_id);
              }
            }

            const lastMsg = (latestMessages || []).find((m) => m.chat_id === chat.id);

            return {
              ...chat,
              participants: enrichedParticipants,
              other_participant: otherParticipant,
              last_message: lastMsg as Message | undefined,
              last_message_at: lastMsg?.created_at || chat.last_message_at,
            };
          });

          loadedChats.sort(
            (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          );

          saveUserChats(userId, loadedChats);
          return loadedChats;
        }
      }
    } catch (err) {
      console.error('Error fetching chats from Supabase:', err);
    }
  }

  // Local Storage Fallback
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
      // A. Ambil pesan murni
      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('Error fetching messages from Supabase:', msgError);
      }

      if (messagesData) {
        // B. Ambil profil sender
        const senderIds = [
          ...new Set(messagesData.map((m) => m.sender_id).filter(Boolean)),
        ];
        const { data: senderProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', senderIds);

        const profileMap = new Map((senderProfiles || []).map((p) => [p.id, p as Profile]));

        // C. Ambil reactions & statuses
        const messageIds = messagesData.map((m) => m.id);
        const { data: reactions } = await supabase
          .from('message_reactions')
          .select('*')
          .in('message_id', messageIds);

        const { data: statuses } = await supabase
          .from('message_statuses')
          .select('*')
          .in('message_id', messageIds);

        const assembled: Message[] = messagesData.map((msg) => ({
          ...msg,
          sender: profileMap.get(msg.sender_id),
          reactions: (reactions || []).filter((r) => r.message_id === msg.id),
          statuses: (statuses || []).filter((s) => s.message_id === msg.id),
        }));

        saveChatMessages(chatId, assembled);
        return assembled;
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
