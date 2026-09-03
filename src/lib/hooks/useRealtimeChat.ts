'use client';

import { useEffect } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useChatStore } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Message, MessageReaction } from '@/types';
import { playMessageReceivedSound } from '@/lib/utils/soundUtils';
import { fetchUserChats } from '@/lib/services/chatService';
import { isValidUuid, toValidUuid } from '@/lib/utils/uuidUtils';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeChat(activeChatId: string | null) {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!isSupabaseConfigured() || !user) return;

    const safeUserId = toValidUuid(user.id);
    const supabase = createClient();
    let messagesChannel: RealtimeChannel | null = null;
    let reactionsChannel: RealtimeChannel | null = null;
    let broadcastChannel: RealtimeChannel | null = null;

    try {
      // Buat nama channel unik per session user agar tidak bertabrakan jika re-mount
      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      const msgChannelName = `user_msgs_${safeUserId}_${uniqueSuffix}`;
      const reactChannelName = `user_reacts_${safeUserId}_${uniqueSuffix}`;

      // 1. Channel untuk mendengarkan pesan masuk
      messagesChannel = supabase
        .channel(msgChannelName)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          async (payload) => {
            try {
              const newMessage = payload.new as Message;

              // Ambil data sender profile jika ada dan id valid UUID
              if (newMessage.sender_id && isValidUuid(newMessage.sender_id)) {
                const { data: senderProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', newMessage.sender_id)
                  .maybeSingle();

                if (senderProfile) {
                  newMessage.sender = senderProfile;
                }
              }

              useChatStore.getState().addMessage(newMessage);

              // Jika chat belum ada di daftar sidebar, ambil ulang obrolan user
              const currentChats = useChatStore.getState().chats;
              if (!currentChats.some((c) => c.id === newMessage.chat_id)) {
                fetchUserChats(safeUserId).then((fresh) => {
                  useChatStore.getState().setChats(fresh);
                });
              }

              // Bunyikan notifikasi jika pesan dari orang lain
              if (newMessage.sender_id !== safeUserId && newMessage.sender_id !== user.id) {
                playMessageReceivedSound();

                // Jika chat ini sedang dibuka, tandai pesan dibaca
                if (activeChatId === newMessage.chat_id) {
                  await supabase
                    .from('message_statuses')
                    .upsert({
                      message_id: newMessage.id,
                      user_id: safeUserId,
                      status: 'read',
                      updated_at: new Date().toISOString(),
                    });
                }
              }
            } catch (err) {
              console.error('Error handling realtime message insert:', err);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages' },
          (payload) => {
            const updated = payload.new as Message;
            useChatStore.getState().updateMessage(updated.chat_id, updated.id, updated);
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'messages' },
          (payload) => {
            const deleted = payload.old as { id: string; chat_id: string };
            if (deleted && deleted.id && deleted.chat_id) {
              useChatStore.getState().deleteMessage(deleted.chat_id, deleted.id, false);
            }
          }
        );

      messagesChannel.subscribe();

      // 2. Channel untuk reaksi emoji pesan
      reactionsChannel = supabase
        .channel(reactChannelName)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'message_reactions' },
          (payload) => {
            const newReaction = payload.new as MessageReaction;
            if (activeChatId) {
              useChatStore.getState().addReaction(activeChatId, newReaction);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'message_reactions' },
          (payload) => {
            const oldReaction = payload.old as { message_id: string; user_id: string };
            if (activeChatId && oldReaction) {
              useChatStore.getState().removeReaction(activeChatId, oldReaction.message_id, oldReaction.user_id);
            }
          }
        );

      reactionsChannel.subscribe();

      // 3. Channel WebSocket Broadcast Realtime
      broadcastChannel = supabase
        .channel('dardcor_chat_broadcast')
        .on('broadcast', { event: 'NEW_MESSAGE' }, async ({ payload }) => {
          try {
            const newMsg = payload as Message;
            if (!newMsg || newMsg.sender_id === safeUserId || newMsg.sender_id === user.id) return;

            // Pastikan data profile pengirim terpasang
            if (!newMsg.sender && newMsg.sender_id && isValidUuid(newMsg.sender_id)) {
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', newMsg.sender_id)
                .maybeSingle();
              if (senderProfile) newMsg.sender = senderProfile;
            }

            useChatStore.getState().addMessage(newMsg);

            const currentChats = useChatStore.getState().chats;
            if (!currentChats.some((c) => c.id === newMsg.chat_id)) {
              fetchUserChats(safeUserId).then((fresh) => {
                useChatStore.getState().setChats(fresh);
              });
            }

            playMessageReceivedSound();
          } catch (err) {
            console.error('Error handling broadcast message:', err);
          }
        })
        .on('broadcast', { event: 'NEW_CHAT' }, async ({ payload }) => {
          try {
            const data = payload as { chatId: string; recipientId: string };
            if (
              data &&
              (data.recipientId === safeUserId ||
                data.recipientId === user.id ||
                data.recipientId === 'ALL')
            ) {
              fetchUserChats(safeUserId).then((fresh) => {
                useChatStore.getState().setChats(fresh);
              });
            }
          } catch (err) {
            console.error('Error handling NEW_CHAT broadcast:', err);
          }
        });

      broadcastChannel.subscribe();

      return () => {
        if (messagesChannel) supabase.removeChannel(messagesChannel);
        if (reactionsChannel) supabase.removeChannel(reactionsChannel);
        if (broadcastChannel) supabase.removeChannel(broadcastChannel);
      };
    } catch (e) {
      console.error('Realtime subscription error:', e);
    }
  }, [user?.id, activeChatId]);
}
