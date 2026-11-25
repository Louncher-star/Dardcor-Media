CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'video', 'audio', 'document', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE participant_role_enum AS ENUM ('admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status_enum AS ENUM ('sent', 'delivered', 'read');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    about TEXT DEFAULT 'Ada! Menggunakan Dardcor Media.',
    phone_number TEXT,
    email TEXT,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);

CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_group BOOLEAN DEFAULT false NOT NULL,
    group_name TEXT,
    group_description TEXT,
    group_avatar_url TEXT,
    created_by UUID,
    last_message_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    disappearing_seconds INTEGER DEFAULT 0,
    invite_code TEXT UNIQUE,
    only_admins_can_message BOOLEAN DEFAULT false,
    only_admins_can_edit_info BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_created_by_fkey;
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS disappearing_seconds INTEGER DEFAULT 0;
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS only_admins_can_message BOOLEAN DEFAULT false;
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS only_admins_can_edit_info BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON public.chats(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_invite_code ON public.chats(invite_code);

CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role participant_role_enum DEFAULT 'member' NOT NULL,
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    is_archived BOOLEAN DEFAULT false NOT NULL,
    is_muted BOOLEAN DEFAULT false NOT NULL,
    is_locked BOOLEAN DEFAULT false NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(chat_id, user_id)
);

ALTER TABLE public.chat_participants DROP CONSTRAINT IF EXISTS chat_participants_user_id_fkey;
ALTER TABLE public.chat_participants ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON public.chat_participants(chat_id);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT,
    message_type message_type_enum DEFAULT 'text' NOT NULL,
    media_url TEXT,
    media_name TEXT,
    media_size BIGINT,
    media_mime_type TEXT,
    media_duration INTEGER,
    poll_data JSONB,
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_deleted_for_all BOOLEAN DEFAULT false NOT NULL,
    is_edited BOOLEAN DEFAULT false NOT NULL,
    edited_at TIMESTAMPTZ,
    is_view_once BOOLEAN DEFAULT false NOT NULL,
    is_opened BOOLEAN DEFAULT false NOT NULL,
    link_preview JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_name TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_size BIGINT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_mime_type TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_duration INTEGER;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS poll_data JSONB;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_deleted_for_all BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_view_once BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_opened BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS link_preview JSONB;

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

CREATE TABLE IF NOT EXISTS public.chat_pinned_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    pinned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(chat_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_pinned_chat ON public.chat_pinned_messages(chat_id);

CREATE TABLE IF NOT EXISTS public.call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    caller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
    status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'accepted', 'rejected', 'ended', 'missed')),
    sdp_offer TEXT,
    sdp_answer TEXT,
    ice_candidates JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_call_receiver ON public.call_sessions(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_call_chat ON public.call_sessions(chat_id);

CREATE TABLE IF NOT EXISTS public.user_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_url TEXT,
    caption TEXT,
    background_color TEXT DEFAULT '#7c3aed',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + interval '24 hours') NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_statuses_user_expires ON public.user_statuses(user_id, expires_at);

CREATE TABLE IF NOT EXISTS public.status_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_id UUID NOT NULL REFERENCES public.user_statuses(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(status_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_status_views_status ON public.status_views(status_id);

CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON public.message_reactions(message_id);

CREATE TABLE IF NOT EXISTS public.message_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status delivery_status_enum DEFAULT 'sent' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_statuses_message_user ON public.message_statuses(message_id, user_id);

CREATE TABLE IF NOT EXISTS public.message_deleted_for_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    deleted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.starred_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_starred_messages_user ON public.starred_messages(user_id);

CREATE TABLE IF NOT EXISTS public.blocked_users (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_user ON public.blocked_users(user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_name TEXT;
    default_username TEXT;
    clean_username TEXT;
BEGIN
    default_name := COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1));
    clean_username := lower(regexp_replace(COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), '[^a-zA-Z0-9_]', '', 'g'));
    
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = clean_username) THEN
        default_username := clean_username || '_' || substr(new.id::text, 1, 4);
    ELSE
        default_username := clean_username;
    END IF;

    INSERT INTO public.profiles (id, username, display_name, avatar_url, about)
    VALUES (
        new.id,
        default_username,
        default_name,
        COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id::text),
        COALESCE(new.raw_user_meta_data->>'about', 'Ada! Menggunakan Dardcor Media.')
    )
    ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chats
    SET last_message_at = NEW.created_at,
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

CREATE OR REPLACE FUNCTION public.check_message_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    msg_count INT;
BEGIN
    SELECT COUNT(*) INTO msg_count
    FROM public.messages
    WHERE sender_id = NEW.sender_id
      AND created_at > now() - interval '2 seconds';
      
    IF msg_count > 8 THEN
        RAISE EXCEPTION 'Aktivitas pengiriman pesan terlalu cepat. Silakan tunggu beberapa detik (Anti-Spam Protection).';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_anti_spam_messages ON public.messages;
CREATE TRIGGER trg_anti_spam_messages
    BEFORE INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.check_message_rate_limit();

CREATE OR REPLACE FUNCTION public.is_chat_member(p_chat_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE chat_id = p_chat_id AND user_id = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.is_chat_admin(p_chat_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE chat_id = p_chat_id AND user_id = p_user_id AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_message(p_message_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.messages m
        JOIN public.chat_participants cp ON cp.chat_id = m.chat_id
        JOIN public.chats c ON c.id = m.chat_id
        WHERE m.id = p_message_id
          AND cp.user_id = p_user_id
          AND (
              COALESCE(c.disappearing_seconds, 0) = 0
              OR m.created_at > now() - make_interval(secs => c.disappearing_seconds)
          )
    );
$$;

REVOKE ALL ON FUNCTION public.is_chat_member(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_chat_admin(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_access_message(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_chat_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_chat_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_message(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE lower(username) = lower(p_username)
    );
$$;

REVOKE ALL ON FUNCTION public.username_available(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.username_available(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_or_create_direct_chat(p_user1 UUID, p_user2 UUID)
RETURNS UUID AS $$
DECLARE
    found_chat_id UUID;
    new_chat_id UUID;
BEGIN
    SELECT cp1.chat_id INTO found_chat_id
    FROM public.chat_participants cp1
    JOIN public.chat_participants cp2 ON cp1.chat_id = cp2.chat_id
    JOIN public.chats c ON c.id = cp1.chat_id
    WHERE c.is_group = false
      AND cp1.user_id = p_user1
      AND cp2.user_id = p_user2
    LIMIT 1;

    IF found_chat_id IS NOT NULL THEN
        RETURN found_chat_id;
    END IF;

    new_chat_id := gen_random_uuid();
    INSERT INTO public.chats (id, is_group, created_by, last_message_at)
    VALUES (new_chat_id, false, p_user1, timezone('utc'::text, now()));

    INSERT INTO public.chat_participants (chat_id, user_id, role)
    VALUES 
        (new_chat_id, p_user1, 'member'),
        (new_chat_id, p_user2, 'member')
    ON CONFLICT (chat_id, user_id) DO NOTHING;

    RETURN new_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_deleted_for_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "chats_select_member" ON public.chats;
CREATE POLICY "chats_select_member" ON public.chats
    FOR SELECT TO authenticated USING (public.is_chat_member(id, auth.uid()));

DROP POLICY IF EXISTS "chats_insert_owner" ON public.chats;
CREATE POLICY "chats_insert_owner" ON public.chats
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

DROP POLICY IF EXISTS "chats_update_member" ON public.chats;
CREATE POLICY "chats_update_member" ON public.chats
    FOR UPDATE TO authenticated
    USING (public.is_chat_member(id, auth.uid()))
    WITH CHECK (public.is_chat_member(id, auth.uid()));

DROP POLICY IF EXISTS "chats_delete_member" ON public.chats;
CREATE POLICY "chats_delete_member" ON public.chats
    FOR DELETE TO authenticated USING (public.is_chat_member(id, auth.uid()));

DROP POLICY IF EXISTS "participants_select_member" ON public.chat_participants;
CREATE POLICY "participants_select_member" ON public.chat_participants
    FOR SELECT TO authenticated USING (public.is_chat_member(chat_id, auth.uid()));

DROP POLICY IF EXISTS "participants_insert_authorized" ON public.chat_participants;
CREATE POLICY "participants_insert_authorized" ON public.chat_participants
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.chats c
                WHERE c.id = chat_id AND c.created_by = auth.uid()
            )
            OR public.is_chat_admin(chat_id, auth.uid())
        )
    );

DROP POLICY IF EXISTS "participants_update_self" ON public.chat_participants;
CREATE POLICY "participants_update_self" ON public.chat_participants
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "participants_delete_self_or_admin" ON public.chat_participants;
CREATE POLICY "participants_delete_self_or_admin" ON public.chat_participants
    FOR DELETE TO authenticated
    USING (user_id = auth.uid() OR public.is_chat_admin(chat_id, auth.uid()));

DROP POLICY IF EXISTS "messages_select_member" ON public.messages;
CREATE POLICY "messages_select_member" ON public.messages
    FOR SELECT TO authenticated USING (
        public.is_chat_member(chat_id, auth.uid())
        AND (
            COALESCE(
                (SELECT c.disappearing_seconds FROM public.chats c WHERE c.id = messages.chat_id),
                0
            ) = 0
            OR messages.created_at > now() - make_interval(
                secs => COALESCE(
                    (SELECT c.disappearing_seconds FROM public.chats c WHERE c.id = messages.chat_id),
                    0
                )
            )
        )
    );

DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
CREATE POLICY "messages_insert_sender" ON public.messages
    FOR INSERT TO authenticated WITH CHECK (
        sender_id = auth.uid()
        AND public.is_chat_member(chat_id, auth.uid())
        AND NOT EXISTS (
            SELECT 1
            FROM public.blocked_users b
            JOIN public.chats c ON c.id = messages.chat_id AND c.is_group = false
            JOIN public.chat_participants cp ON cp.chat_id = c.id
            WHERE cp.user_id <> auth.uid()
              AND (
                  (b.user_id = auth.uid() AND b.blocked_user_id = cp.user_id)
                  OR (b.user_id = cp.user_id AND b.blocked_user_id = auth.uid())
              )
        )
    );

DROP POLICY IF EXISTS "messages_update_sender" ON public.messages;
CREATE POLICY "messages_update_sender" ON public.messages
    FOR UPDATE TO authenticated
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "messages_delete_sender" ON public.messages;
CREATE POLICY "messages_delete_sender" ON public.messages
    FOR DELETE TO authenticated USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "pinned_select_member" ON public.chat_pinned_messages;
CREATE POLICY "pinned_select_member" ON public.chat_pinned_messages
    FOR SELECT TO authenticated USING (public.is_chat_member(chat_id, auth.uid()));

DROP POLICY IF EXISTS "pinned_insert_member" ON public.chat_pinned_messages;
CREATE POLICY "pinned_insert_member" ON public.chat_pinned_messages
    FOR INSERT TO authenticated WITH CHECK (public.is_chat_member(chat_id, auth.uid()) AND pinned_by = auth.uid());

DROP POLICY IF EXISTS "pinned_delete_member" ON public.chat_pinned_messages;
CREATE POLICY "pinned_delete_member" ON public.chat_pinned_messages
    FOR DELETE TO authenticated USING (public.is_chat_member(chat_id, auth.uid()));

DROP POLICY IF EXISTS "call_sessions_select_participants" ON public.call_sessions;
CREATE POLICY "call_sessions_select_participants" ON public.call_sessions
    FOR SELECT TO authenticated USING (caller_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "call_sessions_insert_caller" ON public.call_sessions;
CREATE POLICY "call_sessions_insert_caller" ON public.call_sessions
    FOR INSERT TO authenticated WITH CHECK (caller_id = auth.uid());

DROP POLICY IF EXISTS "call_sessions_update_participants" ON public.call_sessions;
CREATE POLICY "call_sessions_update_participants" ON public.call_sessions
    FOR UPDATE TO authenticated USING (caller_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "statuses_select_authenticated" ON public.user_statuses;
CREATE POLICY "statuses_select_authenticated" ON public.user_statuses
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "statuses_insert_self" ON public.user_statuses;
CREATE POLICY "statuses_insert_self" ON public.user_statuses
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "statuses_update_self" ON public.user_statuses;
CREATE POLICY "statuses_update_self" ON public.user_statuses
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "statuses_delete_self" ON public.user_statuses;
CREATE POLICY "statuses_delete_self" ON public.user_statuses
    FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "status_views_select_owner_or_viewer" ON public.status_views;
CREATE POLICY "status_views_select_owner_or_viewer" ON public.status_views
    FOR SELECT TO authenticated USING (
        viewer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.user_statuses s WHERE s.id = status_id AND s.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "status_views_insert_viewer" ON public.status_views;
CREATE POLICY "status_views_insert_viewer" ON public.status_views
    FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid());

DROP POLICY IF EXISTS "reactions_select_member" ON public.message_reactions;
CREATE POLICY "reactions_select_member" ON public.message_reactions
    FOR SELECT TO authenticated USING (public.can_access_message(message_id, auth.uid()));

DROP POLICY IF EXISTS "reactions_insert_self" ON public.message_reactions;
CREATE POLICY "reactions_insert_self" ON public.message_reactions
    FOR INSERT TO authenticated WITH CHECK (
        user_id = auth.uid() AND public.can_access_message(message_id, auth.uid())
    );

DROP POLICY IF EXISTS "reactions_delete_self" ON public.message_reactions;
CREATE POLICY "reactions_delete_self" ON public.message_reactions
    FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "message_statuses_select_member" ON public.message_statuses;
CREATE POLICY "message_statuses_select_member" ON public.message_statuses
    FOR SELECT TO authenticated USING (public.can_access_message(message_id, auth.uid()));

DROP POLICY IF EXISTS "message_statuses_insert_self" ON public.message_statuses;
CREATE POLICY "message_statuses_insert_self" ON public.message_statuses
    FOR INSERT TO authenticated WITH CHECK (
        user_id = auth.uid() AND public.can_access_message(message_id, auth.uid())
    );

DROP POLICY IF EXISTS "message_statuses_update_self" ON public.message_statuses;
CREATE POLICY "message_statuses_update_self" ON public.message_statuses
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "hidden_select_self" ON public.message_deleted_for_users;
CREATE POLICY "hidden_select_self" ON public.message_deleted_for_users
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "hidden_insert_self" ON public.message_deleted_for_users;
CREATE POLICY "hidden_insert_self" ON public.message_deleted_for_users
    FOR INSERT TO authenticated WITH CHECK (
        user_id = auth.uid() AND public.can_access_message(message_id, auth.uid())
    );

DROP POLICY IF EXISTS "hidden_delete_self" ON public.message_deleted_for_users;
CREATE POLICY "hidden_delete_self" ON public.message_deleted_for_users
    FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "starred_select_self" ON public.starred_messages;
CREATE POLICY "starred_select_self" ON public.starred_messages
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "starred_insert_self" ON public.starred_messages;
CREATE POLICY "starred_insert_self" ON public.starred_messages
    FOR INSERT TO authenticated WITH CHECK (
        user_id = auth.uid() AND public.can_access_message(message_id, auth.uid())
    );

DROP POLICY IF EXISTS "starred_delete_self" ON public.starred_messages;
CREATE POLICY "starred_delete_self" ON public.starred_messages
    FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "blocked_select_self" ON public.blocked_users;
CREATE POLICY "blocked_select_self" ON public.blocked_users
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "blocked_insert_self" ON public.blocked_users;
CREATE POLICY "blocked_insert_self" ON public.blocked_users
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "blocked_delete_self" ON public.blocked_users;
CREATE POLICY "blocked_delete_self" ON public.blocked_users
    FOR DELETE TO authenticated USING (user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-media', 'chat-media', true, null, null)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = null,
    allowed_mime_types = null;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 10485760, null)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = null;

DO $$ BEGIN
    CREATE POLICY "Public read access on chat-media"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'chat-media');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated insert on chat-media"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (
            bucket_id = 'chat-media'
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Owner update on chat-media"
        ON storage.objects FOR UPDATE TO authenticated
        USING (bucket_id = 'chat-media' AND owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Owner delete on chat-media"
        ON storage.objects FOR DELETE TO authenticated
        USING (bucket_id = 'chat-media' AND owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public read access on avatars"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated insert on avatars"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (
            bucket_id = 'avatars'
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Owner update on avatars"
        ON storage.objects FOR UPDATE TO authenticated
        USING (bucket_id = 'avatars' AND owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_statuses;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_pinned_messages;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.status_views;
EXCEPTION WHEN others THEN null;
END $$;
