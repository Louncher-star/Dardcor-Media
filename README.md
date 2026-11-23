# Dardcor Media

Aplikasi pesan instan real-time bergaya WhatsApp dengan aksen ungu, dibangun memakai Next.js 16, React 19, Tailwind CSS 4, Zustand, dan Supabase.

## Fitur

- Obrolan pribadi dan grup dengan pengiriman pesan real-time
- Foto, video, dokumen apa pun, dan pesan suara
- Balas pesan, reaksi emoji, hapus untuk saya/semua, teruskan, dan pesan berbintang
- Centang terkirim/dibaca, indikator sedang mengetik, dan status online
- Kelola obrolan: sematkan, bisukan, arsipkan, tandai belum dibaca, bersihkan, hapus
- Pencarian dalam obrolan dan panel info kontak/grup
- Status 24 jam dengan teks atau foto
- Tema terang/gelap, pengaturan profil, dan unggah avatar
- PWA yang dapat dipasang di Android, iOS, tablet, dan desktop

## Menjalankan

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Database

Jalankan seluruh isi `database.sql` di Supabase SQL Editor. Skrip tersebut membuat tabel, kebijakan RLS, bucket storage, dan replikasi realtime yang dibutuhkan aplikasi.

## Variabel lingkungan

Salin `.env.example` menjadi `.env.local`, lalu isi kredensial Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Tanpa Supabase, aplikasi tetap dapat dipakai dalam mode lokal memakai `localStorage`.

## Build

```bash
npm run build
npm run start
```
