# PANDUAN PUBLISH NOEVIA KE VERCEL + GITHUB ACTIONS (`DEPLOYMENT_GUIDE.md`)

Panduan ini menjelaskan langkah demi langkah untuk mempublikasikan **Noevia** melalui **GitHub + Vercel + GitHub Actions** agar Anda mendapatkan link website publik (`https://nama-proyek.vercel.app`) tanpa membocorkan `GEMINI_API_KEY` atau kredensial database Firebase ke repositori GitHub.

---

## 1. Berkas Konfigurasi yang Sudah Disiapkan di Proyek Ini

1. **`api/index.ts`** — Entry point Serverless Function Vercel yang menjalankan seluruh endpoint Express (`/api/consultation/discovery`, `/api/consultation/analyze`, `/api/consultation/continue`, `/api/consultation/inspect-url`, `/api/consultation/document-access`, `/api/health`).
2. **`vercel.json`** — Mengatur *timeout* fungsi AI hingga **60 detik** (`maxDuration: 60`), header keamanan HTTP, serta routing `/api/*` ke backend dan halaman lainnya ke SPA React (`dist/index.html`).
3. **`scripts/ensure-firebase-config.mjs`** — Skrip otomatis saat *build* di GitHub Actions / Vercel yang merakit `firebase-applet-config.json` dari variabel lingkungan `VITE_FIREBASE_*` (karena berkas aslinya diblokir di `.gitignore` agar aman).
4. **`.github/workflows/deploy-vercel.yml`** — Workflow GitHub Actions yang otomatis:
   - Menjalankan pemeriksaan tipe (`npm run lint`) dan **22 pengujian keamanan & unit**.
   - Melakukan *build* dan *deploy* ke Vercel.
   - Menampilkan **Link Website Publik** langsung di bagian **Summary** pada tab **Actions** di GitHub.

---

## 2. Langkah 1 — Buat Proyek di Vercel & Masukkan Environment Variables

1. Buka [https://vercel.com/new](https://vercel.com/new) dan login menggunakan akun GitHub Anda.
2. Pilih repositori GitHub **Noevia** Anda.
3. Pada bagian **Environment Variables** di Vercel, tambahkan variabel berikut:
   - **`GEMINI_API_KEY`** = *(Isi dengan Gemini API Key Anda — ini hanya berjalan di server Vercel, aman dari browser)*
   - **`VITE_FIREBASE_PROJECT_ID`** = *(Isi dengan `projectId` dari `firebase-applet-config.json` lokal Anda)*
   - **`VITE_FIREBASE_APP_ID`** = *(Isi dengan `appId` dari `firebase-applet-config.json`)*
   - **`VITE_FIREBASE_API_KEY`** = *(Isi dengan `apiKey` dari `firebase-applet-config.json`)*
   - **`VITE_FIREBASE_AUTH_DOMAIN`** = *(Isi dengan `authDomain` dari `firebase-applet-config.json`)*
   - **`VITE_FIREBASE_FIRESTORE_DATABASE_ID`** = *(Isi dengan `firestoreDatabaseId` dari `firebase-applet-config.json`)*
   - **`VITE_FIREBASE_STORAGE_BUCKET`** = *(Isi dengan `storageBucket` dari `firebase-applet-config.json`)*
   - **`VITE_FIREBASE_MESSAGING_SENDER_ID`** = *(Isi dengan `messagingSenderId` dari `firebase-applet-config.json`)*

---

## 3. Langkah 2 — Tambahkan Secrets di GitHub (Untuk GitHub Actions)

Agar workflow `.github/workflows/deploy-vercel.yml` dapat men-deploy dan mencetak link publik di GitHub Actions:

1. Buka repositori GitHub Anda -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
2. Tambahkan 3 secret Vercel berikut:
   - **`VERCEL_TOKEN`**: Buat token di [https://vercel.com/account/tokens](https://vercel.com/account/tokens).
   - **`VERCEL_ORG_ID`**: Dapat dilihat di Vercel Dashboard -> **Account Settings** -> **General** (bagian *Your ID* atau *Team ID*).
   - **`VERCEL_PROJECT_ID`**: Dapat dilihat di Vercel Dashboard -> **Project Settings** -> **General** (bagian *Project ID*).
3. Tambahkan juga variabel `VITE_FIREBASE_*` yang sama di GitHub Secrets jika Anda ingin proses verifikasi & build di GitHub Actions menggunakan konfigurasi Firebase penuh.

---

## 4. Langkah 3 — Daftarkan Domain Vercel di Firebase Authentication (Agar Login Google Berfungsi)

Setelah website Anda ter-deploy dan Anda mendapatkan link publik (contoh: `https://noevia-umkm.vercel.app`):

1. Buka [Firebase Console](https://console.firebase.google.com/) -> pilih proyek Firebase Anda.
2. Masuk ke menu **Authentication** -> tab **Settings** -> **Authorized domains**.
3. Klik **Add domain**, lalu masukkan domain Vercel Anda (contoh: `noevia-umkm.vercel.app`).
4. Simpan. Sekarang tombol **Masuk dengan Google** dan sinkronisasi Firestore akan langsung berfungsi di link publik Vercel Anda!
