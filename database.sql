-- ============================================================================
-- WHATSAPP CLONE - SUPABASE DATABASE SCHEMA (database.sql)
-- ============================================================================
-- Jalankan skrip ini langsung di Supabase SQL Editor:
-- Dashboard Supabase -> SQL Editor -> New query -> Paste & Run
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
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

-- 3. PROFILES TABLE (Sinkronisasi otomatis dengan auth.users Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    about TEXT DEFAULT 'Ada! Menggunakan WhatsApp.',
    phone_number TEXT,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);

-- 4. CHATS TABLE (Mendukung 1-on-1 dan Grup)
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_group BOOLEAN DEFAULT false NOT NULL,
    group_name TEXT,
    group_description TEXT,
    group_avatar_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON public.chats(last_message_at DESC);

-- 5. CHAT PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role participant_role_enum DEFAULT 'member' NOT NULL,
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    is_archived BOOLEAN DEFAULT false NOT NULL,
    is_muted BOOLEAN DEFAULT false NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON public.chat_participants(chat_id);

-- 6. MESSAGES TABLE
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
    media_duration INTEGER, -- Detik (untuk audio / rekaman suara)
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_deleted_for_all BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- 7. MESSAGE DELETED FOR SPECIFIC USERS ("Hapus untuk saya")
CREATE TABLE IF NOT EXISTS public.message_deleted_for_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    deleted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, user_id)
);

-- 8. MESSAGE REACTIONS
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON public.message_reactions(message_id);

-- 9. MESSAGE STATUSES (Sent, Delivered, Read Receipts)
CREATE TABLE IF NOT EXISTS public.message_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status delivery_status_enum DEFAULT 'sent' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_statuses_message_user ON public.message_statuses(message_id, user_id);

-- 10. USER STORIES / STATUS (24 Jam)
CREATE TABLE IF NOT EXISTS public.user_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_url TEXT,
    caption TEXT,
    background_color TEXT DEFAULT '#00a884',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + interval '24 hours') NOT NULL
);

-- 11. CONTACTS / SAVED USERS
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    custom_name TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, contact_user_id)
);

-- ============================================================================
-- HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Cek apakah user adalah participant di chat (Security Definer mencegah rekursi RLS)
CREATE OR REPLACE FUNCTION public.is_chat_participant(check_chat_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE chat_id = check_chat_id AND user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Otomatis Buat Profil saat Sign Up di Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_name TEXT;
    default_username TEXT;
    clean_username TEXT;
BEGIN
    default_name := COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1));
    clean_username := lower(regexp_replace(COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), '[^a-zA-Z0-9_]', '', 'g'));
    
    -- Pastikan username unik
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
        COALESCE(new.raw_user_meta_data->>'about', 'Ada! Menggunakan WhatsApp.')
    )
    ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Update last_message_at di tabel chats saat ada pesan baru
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

-- Function: Update updated_at otomatis
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_chats_updated_at ON public.chats;
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_deleted_for_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Profiles: Semua authenticated user bisa melihat profile orang lain (untuk mencari kontak & chat)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Chats: User hanya bisa melihat chat di mana ia terdaftar sebagai participant
DROP POLICY IF EXISTS "Users can view chats they participate in" ON public.chats;
CREATE POLICY "Users can view chats they participate in" 
ON public.chats FOR SELECT TO authenticated 
USING (public.is_chat_participant(id, auth.uid()));

DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
CREATE POLICY "Users can create chats" 
ON public.chats FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

DROP POLICY IF EXISTS "Chat participants can update chat info" ON public.chats;
CREATE POLICY "Chat participants can update chat info" 
ON public.chats FOR UPDATE TO authenticated 
USING (public.is_chat_participant(id, auth.uid()));

-- Chat Participants: User bisa melihat peserta di obrolan yang ia ikuti
DROP POLICY IF EXISTS "Users can view participants of their chats" ON public.chat_participants;
CREATE POLICY "Users can view participants of their chats" 
ON public.chat_participants FOR SELECT TO authenticated 
USING (public.is_chat_participant(chat_id, auth.uid()));

DROP POLICY IF EXISTS "Users can join or be added to chats" ON public.chat_participants;
CREATE POLICY "Users can join or be added to chats" 
ON public.chat_participants FOR INSERT TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own participant settings" ON public.chat_participants;
CREATE POLICY "Users can update their own participant settings" 
ON public.chat_participants FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

-- Messages: User hanya bisa melihat pesan di obrolan miliknya dan tidak dihapus "for me"
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats" 
ON public.messages FOR SELECT TO authenticated 
USING (
    public.is_chat_participant(chat_id, auth.uid()) 
    AND NOT EXISTS (
        SELECT 1 FROM public.message_deleted_for_users 
        WHERE message_id = id AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;
CREATE POLICY "Users can send messages to their chats" 
ON public.messages FOR INSERT TO authenticated 
WITH CHECK (
    public.is_chat_participant(chat_id, auth.uid()) 
    AND auth.uid() = sender_id
);

DROP POLICY IF EXISTS "Senders can edit/delete their own messages" ON public.messages;
CREATE POLICY "Senders can edit/delete their own messages" 
ON public.messages FOR UPDATE TO authenticated 
USING (auth.uid() = sender_id);

-- Message Reactions
DROP POLICY IF EXISTS "Participants can view reactions" ON public.message_reactions;
CREATE POLICY "Participants can view reactions" 
ON public.message_reactions FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.messages m 
        WHERE m.id = message_id AND public.is_chat_participant(m.chat_id, auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can react to messages" ON public.message_reactions;
CREATE POLICY "Users can react to messages" 
ON public.message_reactions FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.message_reactions;
CREATE POLICY "Users can delete their own reactions" 
ON public.message_reactions FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- Message Statuses (Read receipts)
DROP POLICY IF EXISTS "View message statuses" ON public.message_statuses;
CREATE POLICY "View message statuses" 
ON public.message_statuses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Upsert message status" ON public.message_statuses;
CREATE POLICY "Upsert message status" 
ON public.message_statuses FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Update message status" ON public.message_statuses;
CREATE POLICY "Update message status" 
ON public.message_statuses FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

-- Message Deleted for Me
DROP POLICY IF EXISTS "Manage deleted for me" ON public.message_deleted_for_users;
CREATE POLICY "Manage deleted for me" 
ON public.message_deleted_for_users FOR ALL TO authenticated 
USING (auth.uid() = user_id);

-- Contacts
DROP POLICY IF EXISTS "Manage own contacts" ON public.contacts;
CREATE POLICY "Manage own contacts" 
ON public.contacts FOR ALL TO authenticated 
USING (auth.uid() = user_id);

-- User Statuses / Stories
DROP POLICY IF EXISTS "View unexpired statuses" ON public.user_statuses;
CREATE POLICY "View unexpired statuses" 
ON public.user_statuses FOR SELECT TO authenticated 
USING (expires_at > timezone('utc'::text, now()));

DROP POLICY IF EXISTS "Insert own status" ON public.user_statuses;
CREATE POLICY "Insert own status" 
ON public.user_statuses FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SUPABASE REALTIME CONFIGURATION
-- ============================================================================

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_statuses;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- SUPABASE STORAGE BUCKETS SETUP
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can update their avatars" ON storage.objects;
CREATE POLICY "Authenticated users can update their avatars" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'avatars');

-- Storage Policies for Chat Media
DROP POLICY IF EXISTS "Chat media is accessible by authenticated users" ON storage.objects;
CREATE POLICY "Chat media is accessible by authenticated users" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat media" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'chat-media');
