'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useChatStore } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { RealtimeChannel } from '@supabase/supabase-js';

export function usePresence(activeChatId: string | null) {
  const { user } = useAuthStore();
  const { setOnlineUserIds, setUserTyping } = useChatStore();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !user) return;

    const supabase = createClient();
    let presenceChannel: RealtimeChannel | null = null;

    try {
      const channelName = `presence_room_${user.id}_${Math.random().toString(36).substring(2, 8)}`;

      presenceChannel = supabase.channel(channelName, {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          if (!presenceChannel) return;
          const state = presenceChannel.presenceState();
          const onlineIds = Object.keys(state);
          setOnlineUserIds(onlineIds);
        })
        .on('presence', { event: 'join' }, () => {
          if (!presenceChannel) return;
          const state = presenceChannel.presenceState();
          setOnlineUserIds(Object.keys(state));
        })
        .on('presence', { event: 'leave' }, () => {
          if (!presenceChannel) return;
          const state = presenceChannel.presenceState();
          setOnlineUserIds(Object.keys(state));
        })
        // Broadcast event untuk typing indicator
        .on('broadcast', { event: 'typing' }, (payload) => {
          const data = payload?.payload;
          if (data && data.userId !== user.id) {
            setUserTyping(data.chatId, data.userId, data.name, data.isTyping);
          }
        });

      presenceChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && presenceChannel) {
          try {
            await presenceChannel.track({
              user_id: user.id,
              username: user.username,
              display_name: user.display_name,
              avatar_url: user.avatar_url,
              online_at: new Date().toISOString(),
            });
          } catch (err) {
            console.error('Error tracking presence:', err);
          }
        }
      });

      channelRef.current = presenceChannel;
    } catch (e) {
      console.error('Presence channel error:', e);
    }

    return () => {
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
      channelRef.current = null;
    };
  }, [user?.id, setOnlineUserIds, setUserTyping]);

  // Fungsi untuk mengirim sinyal sedang mengetik
  const sendTypingSignal = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !user || !activeChatId) return;

      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            chatId: activeChatId,
            userId: user.id,
            name: user.display_name || user.username,
            isTyping,
          },
        });

        if (isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            sendTypingSignal(false);
          }, 2500);
        }
      } catch (err) {
        console.error('Error sending typing signal:', err);
      }
    },
    [user, activeChatId]
  );

  return { sendTypingSignal };
}
