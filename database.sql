-- ============================================================================
-- DARDCOR MEDIA - SUPABASE DATABASE SCHEMA & REAL-TIME CLOUD SYNC
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

-- 3. PROFILES TABLE (Mendukung ID Supabase Auth maupun direct ID)
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

-- Lepaskan constraint foreign key jika sebelumnya pernah ada
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);

-- 4. CHATS TABLE (Mendukung 1-on-1 dan Grup)
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_group BOOLEAN DEFAULT false NOT NULL,
    group_name TEXT,
    group_description TEXT,
    group_avatar_url TEXT,
    created_by UUID,
    last_message_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_created_by_fkey;

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

ALTER TABLE public.chat_participants DROP CONSTRAINT IF EXISTS chat_participants_user_id_fkey;

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

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

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
    background_color TEXT DEFAULT '#7c3aed',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + interval '24 hours') NOT NULL
);

-- ============================================================================
-- HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

-- Tambahkan kolom email dan password jika belum ada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- Function: Otomatis Buat Profil saat Sign Up di Supabase Auth (Aman & Tidak Pernah Crash)
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

    INSERT INTO public.profiles (id, username, display_name, avatar_url, about, email)
    VALUES (
        new.id,
        default_username,
        default_name,
        COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id::text),
        COALESCE(new.raw_user_meta_data->>'about', 'Ada! Menggunakan Dardcor Media.'),
        new.email
    )
    ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Mencegah Database error: jika ada kendala di trigger, user tetap berhasil terdaftar di auth.users
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

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES TERBUKA (MULTI-DEVICE & VERCEL REALTIME)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statuses ENABLE ROW LEVEL SECURITY;

-- Profiles: Semua pengguna dapat melihat dan mendaftarkan profil
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert profiles" ON public.profiles;
CREATE POLICY "Anyone can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can update profiles" ON public.profiles;
CREATE POLICY "Anyone can update profiles" ON public.profiles FOR UPDATE USING (true);

-- Chats: Semua percakapan dapat diakses dan dibuat antar perangkat
DROP POLICY IF EXISTS "Users can view chats they participate in" ON public.chats;
DROP POLICY IF EXISTS "Anyone can view chats" ON public.chats;
CREATE POLICY "Anyone can view chats" ON public.chats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Anyone can create chats" ON public.chats;
CREATE POLICY "Anyone can create chats" ON public.chats FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Chat participants can update chat info" ON public.chats;
DROP POLICY IF EXISTS "Anyone can update chats" ON public.chats;
CREATE POLICY "Anyone can update chats" ON public.chats FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete chats" ON public.chats;
CREATE POLICY "Anyone can delete chats" ON public.chats FOR DELETE USING (true);

-- Chat Participants:
DROP POLICY IF EXISTS "Users can view participants of their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Anyone can view chat participants" ON public.chat_participants;
CREATE POLICY "Anyone can view chat participants" ON public.chat_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join or be added to chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Anyone can add chat participants" ON public.chat_participants;
CREATE POLICY "Anyone can add chat participants" ON public.chat_participants FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete chat participants" ON public.chat_participants;
CREATE POLICY "Anyone can delete chat participants" ON public.chat_participants FOR DELETE USING (true);

-- Messages:
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;
CREATE POLICY "Anyone can view messages" ON public.messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON public.messages;
CREATE POLICY "Anyone can send messages" ON public.messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete messages" ON public.messages;
CREATE POLICY "Anyone can delete messages" ON public.messages FOR DELETE USING (true);

-- Reactions & Statuses:
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.message_reactions;
CREATE POLICY "Anyone can view reactions" ON public.message_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert reactions" ON public.message_reactions;
CREATE POLICY "Anyone can insert reactions" ON public.message_reactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete reactions" ON public.message_reactions;
CREATE POLICY "Anyone can delete reactions" ON public.message_reactions FOR DELETE USING (true);

DROP POLICY IF EXISTS "Anyone can view statuses" ON public.message_statuses;
CREATE POLICY "Anyone can view statuses" ON public.message_statuses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert statuses" ON public.message_statuses;
CREATE POLICY "Anyone can insert statuses" ON public.message_statuses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete statuses" ON public.message_statuses;
CREATE POLICY "Anyone can delete statuses" ON public.message_statuses FOR DELETE USING (true);

DROP POLICY IF EXISTS "Anyone can view stories" ON public.user_statuses;
CREATE POLICY "Anyone can view stories" ON public.user_statuses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert stories" ON public.user_statuses;
CREATE POLICY "Anyone can insert stories" ON public.user_statuses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete stories" ON public.user_statuses;
CREATE POLICY "Anyone can delete stories" ON public.user_statuses FOR DELETE USING (true);

-- ============================================================================
-- 11. FUNGSI RESOLUSI OBROLAN 1-ON-1 TANPA DUPLIKASI
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_or_create_direct_chat(p_user1 UUID, p_user2 UUID)
RETURNS UUID AS $$
DECLARE
    found_chat_id UUID;
    new_chat_id UUID;
BEGIN
    -- 1. Cari obrolan langsung yang sudah ada antara kedua user
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

    -- 2. Jika belum ada, buat obrolan baru secara atomik
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

-- ============================================================================
-- 12. PEMBERSIHAN OTOMATIS OBROLAN DUPLIKAT YANG PERNAH TERSIMPAN
-- ============================================================================
DO $$
DECLARE
    rec RECORD;
    primary_id UUID;
    dup_id UUID;
BEGIN
    FOR rec IN 
        SELECT cp1.user_id AS u1, cp2.user_id AS u2, array_agg(cp1.chat_id ORDER BY c.last_message_at DESC) AS chat_ids
        FROM public.chat_participants cp1
        JOIN public.chat_participants cp2 ON cp1.chat_id = cp2.chat_id AND cp1.user_id < cp2.user_id
        JOIN public.chats c ON c.id = cp1.chat_id
        WHERE c.is_group = false
        GROUP BY cp1.user_id, cp2.user_id
        HAVING count(cp1.chat_id) > 1
    LOOP
        primary_id := rec.chat_ids[1];
        FOREACH dup_id IN ARRAY rec.chat_ids[2:array_length(rec.chat_ids, 1)]
        LOOP
            -- Pindahkan semua pesan ke obrolan utama
            UPDATE public.messages SET chat_id = primary_id WHERE chat_id = dup_id;
            -- Hapus partisipan chat duplikat
            DELETE FROM public.chat_participants WHERE chat_id = dup_id;
            -- Hapus obrolan duplikat
            DELETE FROM public.chats WHERE id = dup_id;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- AKTIFKAN SUPABASE REALTIME REPLICATION
-- ============================================================================
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

-- ============================================================================
-- 13. TIKTOK MEDIA ACCOUNTS (KHUSUS AKUN MEDIA TIKTOK TERPISAH)
-- ============================================================================
-- Tabel ini khusus menyimpan akun TikTok hasil scraping data live pengguna
-- Sistem autentikasi website Dardcor Media (profiles/chats) tetap berjalan terpisah
CREATE TABLE IF NOT EXISTS public.tiktok_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unique_id TEXT UNIQUE NOT NULL,             -- Username TikTok (e.g. 'fuji_an', 'raffi_nagita')
    nickname TEXT NOT NULL,                     -- Nama Tampilan TikTok
    avatar_url TEXT NOT NULL,                   -- Foto Profil Asli TikTok (Hasil Scrape Live)
    signature TEXT DEFAULT '',                  -- Bio Profil TikTok
    verified BOOLEAN DEFAULT false,             -- Status Centang Biru Resmi TikTok
    follower_count BIGINT DEFAULT 0,            -- Jumlah Pengikut Real
    following_count BIGINT DEFAULT 0,           -- Jumlah Mengikuti Real
    heart_count BIGINT DEFAULT 0,               -- Total Suka / Hearts Real
    video_count INT DEFAULT 0,                  -- Total Video Real
    sec_uid TEXT,                               -- ID Enkripsi TikTok
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_active_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tiktok_accounts_unique_id ON public.tiktok_accounts(unique_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_accounts_last_active ON public.tiktok_accounts(last_active_at DESC);

-- RLS untuk tabel tiktok_accounts (memungkinkan pembacaan & penyimpanan akun scraping)
ALTER TABLE public.tiktok_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read access on tiktok_accounts"
        ON public.tiktok_accounts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public insert and update on tiktok_accounts"
        ON public.tiktok_accounts FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tiktok_accounts;
EXCEPTION WHEN others THEN null;
END $$;

-- ============================================================================
-- 14. TIKTOK DIRECT MESSAGES (PESAN KHUSUS ANTAR TEMAN/KREATOR TIKTOK)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tiktok_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_handle TEXT NOT NULL,
    receiver_handle TEXT NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tiktok_messages_pair ON public.tiktok_messages(sender_handle, receiver_handle);
CREATE INDEX IF NOT EXISTS idx_tiktok_messages_created ON public.tiktok_messages(created_at ASC);

ALTER TABLE public.tiktok_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public all access on tiktok_messages"
        ON public.tiktok_messages FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tiktok_messages;
EXCEPTION WHEN others THEN null;
END $$;

-- ============================================================================
-- 15. TIKTOK UPLOADED VIDEOS (VIDEO HASIL UNGGAH PENGGUNA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tiktok_uploaded_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_unique_id TEXT NOT NULL,
    author_nickname TEXT NOT NULL,
    author_avatar TEXT NOT NULL,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    cover_url TEXT NOT NULL,
    digg_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    share_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tiktok_uploaded_videos_author ON public.tiktok_uploaded_videos(author_unique_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_uploaded_videos_created ON public.tiktok_uploaded_videos(created_at DESC);

ALTER TABLE public.tiktok_uploaded_videos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public all access on tiktok_uploaded_videos"
        ON public.tiktok_uploaded_videos FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tiktok_uploaded_videos;
EXCEPTION WHEN others THEN null;
END $$;


