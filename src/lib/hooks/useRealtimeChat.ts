'use client';

import { useEffect } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useChatStore } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Message, MessageReaction } from '@/types';
import { playMessageReceivedSound } from '@/lib/utils/soundUtils';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeChat(activeChatId: string | null) {
  const { user } = useAuthStore();
  const { addMessage, updateMessage, deleteMessage, addReaction, removeReaction } = useChatStore();

  useEffect(() => {
    if (!isSupabaseConfigured() || !user) return;

    const supabase = createClient();
    let messagesChannel: RealtimeChannel | null = null;
    let reactionsChannel: RealtimeChannel | null = null;

    try {
      // Buat nama channel unik per session user agar tidak bertabrakan jika re-mount
      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      const msgChannelName = `user_msgs_${user.id}_${uniqueSuffix}`;
      const reactChannelName = `user_reacts_${user.id}_${uniqueSuffix}`;

      // 1. Channel untuk mendengarkan pesan masuk
      messagesChannel = supabase
        .channel(msgChannelName)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          async (payload) => {
            try {
              const newMessage = payload.new as Message;

              // Ambil data sender profile jika ada
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', newMessage.sender_id)
                .maybeSingle();

              if (senderProfile) {
                newMessage.sender = senderProfile;
              }

              addMessage(newMessage);

              // Bunyikan notifikasi jika pesan dari orang lain
              if (newMessage.sender_id !== user.id) {
                playMessageReceivedSound();

                // Jika chat ini sedang dibuka, tandai pesan dibaca
                if (activeChatId === newMessage.chat_id) {
                  await supabase
                    .from('message_statuses')
                    .upsert({
                      message_id: newMessage.id,
                      user_id: user.id,
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
            updateMessage(updated.chat_id, updated.id, updated);
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'messages' },
          (payload) => {
            const deleted = payload.old as { id: string; chat_id: string };
            if (deleted && deleted.id && deleted.chat_id) {
              deleteMessage(deleted.chat_id, deleted.id, false);
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
              addReaction(activeChatId, newReaction);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'message_reactions' },
          (payload) => {
            const oldReaction = payload.old as { message_id: string; user_id: string };
            if (activeChatId && oldReaction) {
              removeReaction(activeChatId, oldReaction.message_id, oldReaction.user_id);
            }
          }
        );

      reactionsChannel.subscribe();
    } catch (e) {
      console.error('Realtime subscription error:', e);
    }

    return () => {
      if (messagesChannel) {
        supabase.removeChannel(messagesChannel);
      }
      if (reactionsChannel) {
        supabase.removeChannel(reactionsChannel);
      }
    };
  }, [user?.id, activeChatId, addMessage, updateMessage, deleteMessage, addReaction, removeReaction]);
}
