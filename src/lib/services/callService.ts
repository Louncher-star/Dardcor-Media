import { CallSession, Profile } from '@/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { toValidUuid } from '@/lib/utils/uuidUtils';
import { broadcastLocalSync } from './chatService';

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export async function createCallSession(
  chatId: string,
  callerId: string,
  receiverId: string,
  callType: 'audio' | 'video'
): Promise<CallSession> {
  const sessionId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');

  const newCall: CallSession = {
    id: sessionId,
    chat_id: chatId,
    caller_id: callerId,
    receiver_id: receiverId,
    call_type: callType,
    status: 'ringing',
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from('call_sessions').insert({
        id: sessionId,
        chat_id: toValidUuid(chatId),
        caller_id: toValidUuid(callerId),
        receiver_id: toValidUuid(receiverId),
        call_type: callType,
        status: 'ringing',
      });
    } catch (err) {
      console.error('Error creating call session in Supabase:', err);
    }
  }

  broadcastLocalSync('CALL_STARTED', newCall);
  return newCall;
}

export async function answerCallSession(sessionId: string, sdpAnswer?: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase
        .from('call_sessions')
        .update({
          status: 'accepted',
          sdp_answer: sdpAnswer || null,
          started_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    } catch (err) {
      console.error('Error answering call session:', err);
    }
  }
  broadcastLocalSync('CALL_ACCEPTED', { sessionId });
}

export async function rejectCallSession(sessionId: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase
        .from('call_sessions')
        .update({
          status: 'rejected',
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    } catch (err) {
      console.error('Error rejecting call session:', err);
    }
  }
  broadcastLocalSync('CALL_REJECTED', { sessionId });
}

export async function endCallSession(sessionId: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase
        .from('call_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    } catch (err) {
      console.error('Error ending call session:', err);
    }
  }
  broadcastLocalSync('CALL_ENDED', { sessionId });
}

export function subscribeToIncomingCalls(
  userId: string,
  onIncomingCall: (call: CallSession) => void
) {
  if (!isSupabaseConfigured()) return () => {};

  const supabase = createClient();
  const safeUserId = toValidUuid(userId);
  const channelName = `call_listener_${safeUserId}_${Date.now()}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'call_sessions',
        filter: `receiver_id=eq.${safeUserId}`,
      },
      async (payload) => {
        const newCall = payload.new as CallSession;
        if (newCall.status === 'ringing') {
          // Muat profil penelpon
          try {
            const { data: callerProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newCall.caller_id)
              .maybeSingle();

            if (callerProfile) {
              newCall.caller = callerProfile as Profile;
            }
          } catch {}
          onIncomingCall(newCall);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
