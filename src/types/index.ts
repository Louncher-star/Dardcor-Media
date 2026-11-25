export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'poll' | 'system';
export type ParticipantRole = 'admin' | 'member';
export type DeliveryStatus = 'sent' | 'delivered' | 'read';

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // daftar user_id yang memilih opsi ini
}

export interface PollData {
  question: string;
  options: PollOption[];
  allow_multiple: boolean;
  total_votes?: number;
}

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

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  site_name?: string;
}

export interface PinnedMessage {
  id: string;
  chat_id: string;
  message_id: string;
  pinned_by: string;
  expires_at?: string | null;
  created_at: string;
  message?: Message;
}

export interface CallSession {
  id: string;
  chat_id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'audio' | 'video';
  status: 'ringing' | 'accepted' | 'rejected' | 'ended' | 'missed';
  sdp_offer?: string | null;
  sdp_answer?: string | null;
  ice_candidates?: any[];
  started_at?: string | null;
  ended_at?: string | null;
  created_at: string;
  caller?: Profile;
  receiver?: Profile;
}

export interface StatusView {
  id: string;
  status_id: string;
  viewer_id: string;
  viewed_at: string;
  viewer?: Profile;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  role: ParticipantRole;
  is_pinned: boolean;
  is_archived: boolean;
  is_muted: boolean;
  is_locked?: boolean;
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
  poll_data?: PollData | null;
  reply_to_id?: string | null;
  is_deleted_for_all: boolean;
  is_edited?: boolean;
  edited_at?: string | null;
  is_view_once?: boolean;
  is_opened?: boolean;
  link_preview?: LinkPreview | null;
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
  is_pinned?: boolean;
  is_archived?: boolean;
  is_muted?: boolean;
  is_locked?: boolean;
  invite_code?: string | null;
  only_admins_can_message?: boolean;
  only_admins_can_edit_info?: boolean;
  my_role?: ParticipantRole;
  disappearing_seconds?: number;
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
