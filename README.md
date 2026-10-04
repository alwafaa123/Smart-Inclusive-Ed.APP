<div align="center">

# 🧠✨ Smart-Inclusive-Ed.APP
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

🚀 Panduan Instalasi & Cara Menjalankan
Ikuti langkah-langkah di bawah ini untuk mengunduh dan menjalankan aplikasi secara lokal:

1. Kloning Repositori (git clone)
Buka terminal atau command prompt Anda, lalu jalankan perintah berikut untuk mengunduh kode sumber dari GitHub:

git clone [https://github.com/alwafaa123/Smart-Inclusive-Ed.APP.git](https://github.com/alwafaa123/Smart-Inclusive-Ed.APP.git)

2. Masuk ke Direktori Proyek
Pindahkan direktori aktif terminal Anda ke folder proyek yang baru saja diunduh:

cd Smart-Inclusive-Ed.APP

3. Konfigurasi & Menjalankan Backend
Arahkan terminal ke folder backend, lalu instal dependensi yang dibutuhkan dan jalankan server:

### Masuk ke folder backend
cd backend

### Instal dependensi Node.js
npm install

### Jalankan server backend
npm start

(Catatan: Pastikan server backend berjalan dengan sukses sebelum melanjutkan ke tahap frontend).

4. Konfigurasi & Menjalankan Frontend
Buka tab atau jendela terminal baru, arahkan ke direktori frontend, instal dependensi, lalu jalankan antarmuka web:

### Masuk ke folder frontend (dari akar direktori proyek)
cd frontend

### Instal dependensi
npm install

### Jalankan mode pengembangan (development)
npm run dev

5. Akses Aplikasi di Peramban
Setelah server frontend dan backend aktif, buka peramban web (browser) Anda dan akses tautan berikut:

Frontend UI: http://localhost:3000 (atau port sesuai konfigurasi framework frontend Anda)

----

### 🗄️ Database Setup — Membuat Database Smart Inclusive Ed

Smart Inclusive Ed menggunakan **MySQL** sebagai database untuk menyimpan data pengguna, kelas, materi pembelajaran, tugas, progres belajar, dan notifikasi.

Tersedia dua cara untuk menyiapkan database secara lokal.

### Metode 1 — Membuat Database Melalui phpMyAdmin

**Langkah 1: Jalankan MySQL**

1. Buka XAMPP Control Panel.
2. Klik **Start** pada modul MySQL.
3. Pastikan status MySQL menunjukkan bahwa layanan sedang berjalan.
4. Klik tombol **Admin** untuk membuka phpMyAdmin.

**Langkah 2: Buat database**

1. Pilih menu **New** pada phpMyAdmin.
2. Masukkan nama database:

```sql
smart_inclusive_ed
```

3. Pilih collation `utf8mb4_unicode_ci` jika tersedia.
4. Klik **Create**.

Database kosong kini sudah tersedia.

### Metode 2 — Membuat Database Menggunakan File SQL

Metode ini direkomendasikan untuk juri karena seluruh struktur database dapat disiapkan secara lebih praktis.

**Langkah 1: Siapkan file SQL**

Di dalam repositori, sediakan folder dan file berikut:

```text
smart-inclusive-ed/
└── database/
    └── smart_inclusive_ed.sql
```

File `smart_inclusive_ed.sql` berisi perintah SQL untuk membuat database dan seluruh tabel yang dibutuhkan aplikasi.

**Langkah 2: Isi file SQL**

Berikut contoh struktur dasar database yang digunakan oleh Smart Inclusive Ed. Ini merupakan contoh skema inti; sebelum dipakai, sesuaikan dengan struktur tabel yang benar-benar digunakan oleh backend proyek.

```sql
CREATE DATABASE IF NOT EXISTS smart_inclusive_ed
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE smart_inclusive_ed;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE student_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    learning_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE accessibility_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    font_size INT NOT NULL DEFAULT 16,
    line_spacing DECIMAL(3,1) NOT NULL DEFAULT 1.5,
    high_contrast BOOLEAN NOT NULL DEFAULT FALSE,
    dyslexia_friendly_font BOOLEAN NOT NULL DEFAULT FALSE,
    text_to_speech BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    class_code VARCHAR(30) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id)
        REFERENCES users(id)
);

CREATE TABLE class_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_class_student (class_id, student_id),
    FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE CASCADE,
    FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content LONGTEXT,
    content_type ENUM('text', 'video', 'audio', 'mixed')
        NOT NULL DEFAULT 'text',
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE CASCADE
);

CREATE TABLE module_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed')
        NOT NULL DEFAULT 'not_started',
    last_accessed_at DATETIME,
    completed_at DATETIME,
    UNIQUE KEY unique_module_student (module_id, student_id),
    FOREIGN KEY (module_id)
        REFERENCES modules(id)
        ON DELETE CASCADE,
    FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    instructions TEXT,
    due_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE CASCADE
);

CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    answer LONGTEXT,
    score DECIMAL(5,2),
    feedback TEXT,
    submitted_at DATETIME,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_assignment_student
        (assignment_id, student_id),
    FOREIGN KEY (assignment_id)
        REFERENCES assignments(id)
        ON DELETE CASCADE,
    FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM(
        'new_assignment',
        'deadline_reminder',
        'graded',
        'submission_received',
        'grading_reminder'
    ) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    related_id INT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user_read (user_id, is_read),
    INDEX idx_notifications_related (related_id),
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE sessions (
    session_id VARCHAR(128) NOT NULL PRIMARY KEY,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT
);

CREATE INDEX idx_sessions_expires ON sessions(expires);
```

> **Penting:** Skema di atas adalah contoh berdasarkan struktur database yang telah direncanakan. Pastikan struktur tabel `sessions`, tipe data, kolom, dan enum notifikasi cocok dengan versi backend yang ada. Jika proyek sudah memiliki file SQL yang digunakan dan telah diuji, gunakan file tersebut sebagai sumber utama, bukan menggantinya dengan contoh ini.

**Langkah 3: Impor file SQL melalui phpMyAdmin**

1. Buka phpMyAdmin.
2. Pilih tab **Import**.
3. Klik **Choose File**.
4. Pilih `database/smart_inclusive_ed.sql`.
5. Klik **Import** atau **Go**.
6. Tunggu sampai phpMyAdmin menampilkan pesan bahwa proses berhasil.

Jika file SQL membuat database sendiri menggunakan `CREATE DATABASE`, juri tidak perlu membuat database secara manual terlebih dahulu.

**Langkah 4: Konfigurasikan koneksi backend**

Pastikan file `backend/.env` memiliki konfigurasi database yang sesuai:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=smart_inclusive_ed
```

Sesuaikan nama pengguna dan kata sandi MySQL dengan konfigurasi XAMPP di komputer masing-masing.

**Langkah 5: Verifikasi database**

Buka phpMyAdmin dan pilih database `smart_inclusive_ed`.

Pastikan tabel berikut tersedia:

* `users`
* `student_profiles`
* `accessibility_preferences`
* `classes`
* `class_members`
* `modules`
* `module_progress`
* `assignments`
* `submissions`
* `notifications`
* `sessions`

Jika seluruh tabel sudah tersedia, database telah berhasil dibuat.

---

### 👥 Menyiapkan Akun Demo untuk dicoba

Agar dapat mencoba seluruh fitur aplikasi, sediakan akun terlebih dahulu dengan peran berbeda, kecuali admin sudah dibuatkan dengan menggunakan [ admin@smartinclusive.test ] dengan password [ PasswordUji123! ] dan ada juga kriterianya seperti berikut:

| Peran | Email demo                                  | Kegunaan                               |
| ----- | ------------------------------------------- | -------------------------------------- |
| Admin | [admin@demo.local](mailto:admin@demo.local) | Mengelola akun pengguna                |
| Guru  | [guru@demo.local](mailto:guru@demo.local)   | Membuat kelas, materi, dan tugas       |
| Siswa | [siswa@demo.local](mailto:siswa@demo.local) | Mengakses materi dan mengerjakan tugas |

Akun tersebut harus dibuat melalui proses seed yang menggunakan hashing kata sandi sesuai mekanisme autentikasi backend.

**Jangan memasukkan kata sandi teks biasa langsung ke kolom `password_hash`.** Gunakan script seed Node.js dengan `bcryptjs` agar kata sandi demo di-hash terlebih dahulu.

Jangan gunakan akun demo untuk menyimpan data pribadi atau data siswa sungguhan.

---

### ✅ Checklist Sebelum Aplikasi Dicoba :

* [x] Repository GitHub dapat di-clone.
* [x] File `database/smart_inclusive_ed.sql` tersedia.
* [x] Database dapat diimpor melalui phpMyAdmin.
* [x] Backend berhasil terhubung ke MySQL.
* [x] Frontend berhasil terhubung ke backend.
* [x] Akun demo admin, guru, dan siswa tersedia.
* [x] Setiap akun dapat login dan mengakses fitur sesuai perannya.
* [x] Fitur utama telah diuji menggunakan data demo.
* [x] File `.env` dan kata sandi asli tidak disertakan dalam repositori publik.

#### Dengan menyediakan file SQL dan akun demo, proses pengujian aplikasi menjadi lebih praktis dan dapat langsung mengeksplorasi fitur Smart Inclusive Ed.
----


👥 Kontributor

1. Fattahul Halim Alwafaa - Web Development - alwafaa123

3. Dzaqwa Alqawi Fahri - desaigner engineering - dzaqwa45

5. Syahrul Ramadhan Henry - Game Develoment - kliperzcu

7. Bobby Satrio Prabowo - Cyber Security - denbobby

----
## 📂 Struktur Proyek
```text
Smart-Inclusive-Ed.APP/
├── 📁 backend/       # API Server, logika bisnis, dan pengelolaan endpoint
├── 📁 database/      # Skema basis data dan migrasi
├── 📁 frontend/      # Antarmuka pengguna (User Interface) berbasis web
└── 📄 .gitignore     # Pengaturan file yang diabaikan oleh Git

