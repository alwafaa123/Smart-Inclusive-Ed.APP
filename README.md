<div align="center">

# ✨ Smart-Inclusive-Ed.APP

### Platform Aplikasi Web Pendidikan Inklusif Berbasis Teknologi Modern

[![GitHub Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge&logo=github)](https://github.com/alwafaa123/Smart-Inclusive-Ed.APP)
[![Tech Stack](https://img.shields.io/badge/Stack-JavaScript%20%7C%20Node.js-blue?style=for-the-badge&logo=javascript)](https://github.com/alwafaa123/Smart-Inclusive-Ed.APP)
[![License](https://img.shields.io/badge/License-MIT-blueviolet?style=for-the-badge)](LICENSE)

<p align="center"> <strong>One Platform. Equal Access. Unlimited Possibilities.</strong> </p>

<p align="center"> Aplikasi web pembelajaran digital inklusif yang dirancang untuk menghadirkan pengalaman belajar yang lebih mudah diakses, personal, dan terorganisasi bagi setiap siswa. </p>
*Mewujudkan ekosistem pembelajaran yang ramah akses, inklusif, dan adaptif untuk semua kalangan Menuju indonesia Emas yang Maju.*

</div>

---

## 🌟 Tentang Aplikasi

**Smart-Inclusive-Ed.APP** adalah inovasi aplikasi web yang dirancang untuk mendukung sistem pendidikan inklusif. Aplikasi ini mengintegrasikan kemudahan aksesibilitas bagi pengguna dengan berbagai kebutuhan khusus, menyediakan materi pembelajaran yang terstruktur, serta dilengkapi dengan sistem manajemen backend yang handal guna memastikan performa dan keamanan data yang optimal.

Repositori ini disusun menggunakan struktur monorepo yang mencakup komponen **frontend**, **backend**, dan **database** secara terpusat.

---

## 🚀 Panduan Instalasi & Cara Menjalankan

Pastikan Node.js dan MySQL sudah terpasang. Jika menggunakan XAMPP, nyalakan
MySQL dari XAMPP Control Panel terlebih dahulu. Frontend dan backend berjalan
di terminal yang berbeda.

1. Kloning Repositori (git clone)
   Buka terminal atau command prompt Anda, lalu jalankan perintah berikut untuk mengunduh kode sumber dari GitHub:

git clone [https://github.com/alwafaa123/Smart-Inclusive-Ed.APP.git](https://github.com/alwafaa123/Smart-Inclusive-Ed.APP.git)

2. Masuk ke Direktori Proyek
   Pindahkan direktori aktif terminal Anda ke folder proyek yang baru saja diunduh:

cd Smart-Inclusive-Ed.APP

3. Siapkan dan jalankan backend di terminal pertama:

```powershell
cd backend
npm install
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

Pastikan `backend/.env` berisi kredensial MySQL yang benar. Ubah nilai
`SESSION_SECRET` contoh menjadi string acak untuk pengembangan lokal. Database
default bernama `smart_inclusive_ed`.

```powershell
npm run dev
```

Backend berjalan di `http://localhost:5200`. Periksa
`http://localhost:5200/api/health` untuk memastikan API aktif dan
`http://localhost:5200/api/health/database` untuk memastikan MySQL terhubung.

4. Jalankan frontend di terminal kedua, dari direktori akar proyek:

```powershell
cd frontend
npm install
npm run dev
```

5. Buka alamat yang ditampilkan Next.js (biasanya `http://localhost:3000`).
   Jika port 3000 sudah digunakan, Next.js otomatis memilih port lain, misalnya
   3001; backend development menerima origin localhost tersebut. Halaman awal
   tetap dapat dibuka tanpa backend, tetapi login dan fitur yang menggunakan data
   memerlukan backend serta MySQL aktif.

---

### 🗄️ Database MySQL

Backend membutuhkan MySQL. Nyalakan MySQL (misalnya melalui XAMPP), lalu pastikan pengaturan `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME` di `backend/.env` sesuai dengan konfigurasi lokal.

Untuk database baru, impor file `database/schema.sql` melalui tab **Import** di phpMyAdmin. File tersebut membuat database `smart_inclusive_ed` dan tabel yang digunakan proyek. **Perhatian:** skema ini menghapus dan membuat ulang tabel-tabelnya; jangan impor ulang jika database berisi data yang ingin dipertahankan.

Sesudah backend aktif, kunjungi `http://localhost:5200/api/health/database`.
Respons `database: "connected"` menandakan koneksi ke MySQL berhasil.

---

### 👥 Akun untuk mencoba aplikasi

Agar dapat mencoba seluruh fitur aplikasi, sediakan akun terlebih dahulu dengan peran berbeda, kecuali admin sudah dibuatkan dengan menggunakan [ admin@smartinclusive.test ] dengan password [ PasswordUji123! ] dan ada juga kriterianya seperti berikut:

```powershell
cd backend
node createTestUser.js
```

# <<<<<<< HEAD

Script membuat akun `admin@smartinclusive.test` dengan password
`PasswordUji123!`. Gunakan kredensial ini hanya untuk pengembangan lokal.

> > > > > > > 2cbafb4 (Update installation guide, backend port, and enhance frontend styling)

---

### ✅ Checklist Sebelum Aplikasi Dicoba :

- [ ] Repository GitHub dapat di-clone.
- [ ] MySQL aktif dan database telah disiapkan dari `database/schema.sql`.
- [ ] Endpoint health backend menunjukkan API dan database aktif.
- [ ] Frontend terbuka di `http://localhost:3000`.
- [ ] Akun untuk login telah dibuat melalui aplikasi.
- [ ] Pastikan file `.env` dan kredensial asli tidak ikut di-commit.

---

👥 Kontributor

1. Fattahul Halim Alwafaa - Web Development - alwafaa123

2. Dzaqwa Alqawi Fahri - desaigner engineering - dzaqwa45

3. Syahrul Ramadhan Henry - Game Develoment - kliperzcu

4. Bobby Satrio Prabowo - Cyber Security - denbobby

---

## 📂 Struktur Proyek

```text
Smart-Inclusive-Ed.APP/
├── 📁 backend/       # API Server, logika bisnis, dan pengelolaan endpoint
├── 📁 database/      # Skema basis data dan migrasi
├── 📁 frontend/      # Antarmuka pengguna (User Interface) berbasis web
└── 📄 .gitignore     # Pengaturan file yang diabaikan oleh Git
```
