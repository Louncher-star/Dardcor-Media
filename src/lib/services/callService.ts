import { CallSession, Profile } from '@/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { toValidUuid } from '@/lib/utils/uuidUtils';
import { broadcastLocalSync, subscribeToLocalSync } from './chatService';

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
      const { error } = await supabase.from('call_sessions').insert({
        id: sessionId,
        chat_id: toValidUuid(chatId),
        caller_id: toValidUuid(callerId),
        receiver_id: toValidUuid(receiverId),
        call_type: callType,
        status: 'ringing',
      });
      if (error) {
        console.error('Error creating call session in Supabase:', error);
      }
    } catch (err) {
      console.error('Exception creating call session in Supabase:', err);
    }
  }

  broadcastLocalSync('CALL_STARTED', newCall);
  return newCall;
}

export async function answerCallSession(sessionId: string, sdpAnswer?: string) {
  broadcastLocalSync('CALL_ACCEPTED', { sessionId });
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
}

export async function rejectCallSession(sessionId: string) {
  broadcastLocalSync('CALL_REJECTED', { sessionId });
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
}

export async function endCallSession(sessionId: string) {
  broadcastLocalSync('CALL_ENDED', { sessionId });
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
}

export function subscribeToCallSession(
  sessionId: string,
  onUpdate: (session: CallSession) => void
) {
  if (!sessionId) return () => {};

  const localCleanup = subscribeToLocalSync((event: { type: string; payload: any }) => {
    if (
      event.type === 'CALL_ENDED' ||
      event.type === 'CALL_REJECTED' ||
      event.type === 'CALL_ACCEPTED'
    ) {
      if (event.payload?.sessionId === sessionId) {
        onUpdate({
          id: sessionId,
          status:
            event.type === 'CALL_ENDED'
              ? 'ended'
              : event.type === 'CALL_REJECTED'
              ? 'rejected'
              : 'accepted',
        } as CallSession);
      }
    }
  });

  if (!isSupabaseConfigured()) {
    return localCleanup;
  }

  const supabase = createClient();
  const channelName = `call_session_${sessionId}_${Date.now()}`;

  (async () => {
    try {
      const { data } = await supabase
        .from('call_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (data) {
        onUpdate(data as CallSession);
      }
    } catch (err) {
      console.error(err);
    }
  })();

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'call_sessions',
      },
      (payload) => {
        const call = (payload.new || payload.old) as CallSession;
        if (call && call.id === sessionId) {
          onUpdate(call);
        }
      }
    )
    .subscribe();

  return () => {
    localCleanup();
    supabase.removeChannel(channel);
  };
}

export function subscribeToIncomingCalls(
  userId: string,
  onIncomingCall: (call: CallSession) => void,
  onCallDismissed?: (callId: string) => void
) {
  if (!isSupabaseConfigured()) return () => {};

  const supabase = createClient();
  const safeUserId = toValidUuid(userId);
  const channelName = `call_listener_${safeUserId}_${Date.now()}`;

  (async () => {
    try {
      const { data, error } = await supabase
        .from('call_sessions')
        .select('*')
        .eq('receiver_id', safeUserId)
        .eq('status', 'ringing')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const recentCall = data[0] as CallSession;
        const callAgeMs = Date.now() - new Date(recentCall.created_at).getTime();
        if (callAgeMs < 45000) {
          try {
            const { data: callerProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', recentCall.caller_id)
              .maybeSingle();

            if (callerProfile) {
              recentCall.caller = callerProfile as Profile;
            }
          } catch {}
          onIncomingCall(recentCall);
        }
      }
    } catch (err) {
      console.error('Error checking active ringing call:', err);
    }
  })();

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'call_sessions',
      },
      async (payload) => {
        const call = (payload.new || payload.old) as CallSession;
        if (!call) return;

        const isRecipient =
          call.receiver_id === safeUserId ||
          call.receiver_id === userId ||
          call.receiver_id?.toLowerCase() === safeUserId.toLowerCase() ||
          call.receiver_id?.toLowerCase() === userId.toLowerCase();

        if (!isRecipient) return;

        if (call.status === 'ringing') {
          try {
            const { data: callerProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', call.caller_id)
              .maybeSingle();

            if (callerProfile) {
              call.caller = callerProfile as Profile;
            }
          } catch {}
          onIncomingCall(call);
        } else if (
          call.status === 'ended' ||
          call.status === 'rejected' ||
          call.status === 'missed'
        ) {
          onCallDismissed?.(call.id);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
