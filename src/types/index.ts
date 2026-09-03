export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'system';
export type ParticipantRole = 'admin' | 'member';
export type DeliveryStatus = 'sent' | 'delivered' | 'read';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  about?: string | null;
  phone_number?: string | null;
  is_online?: boolean;
  last_seen?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  role: ParticipantRole;
  is_pinned: boolean;
  is_archived: boolean;
  is_muted: boolean;
  last_read_at: string;
  joined_at: string;
  profile?: Profile;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface MessageStatus {
  id: string;
  message_id: string;
  user_id: string;
  status: DeliveryStatus;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  message_type: MessageType;
  media_url?: string | null;
  media_name?: string | null;
  media_size?: number | null;
  media_mime_type?: string | null;
  media_duration?: number | null; // dalam detik untuk audio/voice note
  reply_to_id?: string | null;
  is_deleted_for_all: boolean;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  reply_to?: Message | null;
  reactions?: MessageReaction[];
  statuses?: MessageStatus[];
}

export interface Chat {
  id: string;
  is_group: boolean;
  group_name?: string | null;
  group_description?: string | null;
  group_avatar_url?: string | null;
  created_by?: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  participants: ChatParticipant[];
  last_message?: Message | null;
  unread_count?: number;
  other_participant?: Profile; // untuk 1-on-1 chat
}

export interface UserStatus {
  id: string;
  user_id: string;
  media_url?: string | null;
  caption?: string | null;
  background_color?: string;
  created_at: string;
  expires_at: string;
  profile?: Profile;
}

export interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string;
  custom_name?: string | null;
  created_at: string;
  contact_profile?: Profile;
}

export interface PresenceState {
  [key: string]: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    online_at: string;
  }[];
}
