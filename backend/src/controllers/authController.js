const bcrypt = require("bcryptjs");
const { pool } = require("../config/database");

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi.",
      });
    }

    const [users] = await pool.execute(
      `SELECT id, name, email, password_hash, role, is_active
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()],
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah.",
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Akun ini sedang dinonaktifkan.",
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah.",
      });
    }

    // Membuat ID sesi baru setelah login berhasil.
    req.session.regenerate((error) => {
      if (error) {
        console.error("Session regenerate error:", error);
        return res.status(500).json({
          success: false,
          message: "Terjadi kesalahan saat membuat sesi login.",
        });
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save error:", saveError);
          return res.status(500).json({
            success: false,
            message: "Gagal menyimpan sesi login.",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Login berhasil.",
          user: req.session.user,
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
};

// LOGOUT
exports.logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);
      return res.status(500).json({
        success: false,
        message: "Gagal mengakhiri sesi.",
      });
    }

    res.clearCookie(process.env.SESSION_NAME || "smartinclusive.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logout berhasil.",
    });
  });
};

// MEMERIKSA PENGGUNA YANG SEDANG LOGIN
exports.me = (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.session.user,
  });
};

// REGISTER — Siswa atau guru mendaftar sendiri
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ── Validasi tipe data ────────────────────────────────────────────────
    if (
      typeof name     !== "string" ||
      typeof email    !== "string" ||
      typeof password !== "string" ||
      typeof role     !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Semua kolom wajib diisi.",
      });
    }

    const cleanName  = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Nama harus terdiri dari 2 sampai 100 karakter.",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail) || cleanEmail.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Format email tidak valid.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password harus terdiri dari 8 sampai 72 karakter.",
      });
    }

    // ── Hanya boleh mendaftar sebagai guru atau siswa ─────────────────────
    if (!["teacher", "student"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Peran hanya boleh 'teacher' (Guru) atau 'student' (Siswa).",
      });
    }

    // ── Cek email duplikat ────────────────────────────────────────────────
    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [cleanEmail],
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar. Gunakan email lain atau langsung masuk.",
      });
    }

    // ── Hash password & simpan ────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [cleanName, cleanEmail, passwordHash, role],
    );

    // ── Auto-login setelah register ───────────────────────────────────────
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regenerate error after register:", err);
        return res.status(500).json({
          success: false,
          message: "Akun berhasil dibuat, namun gagal membuat sesi. Silakan login.",
        });
      }

      req.session.user = {
        id:    result.insertId,
        name:  cleanName,
        email: cleanEmail,
        role,
      };

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error after register:", saveErr);
          return res.status(500).json({
            success: false,
            message: "Akun berhasil dibuat, namun gagal menyimpan sesi. Silakan login.",
          });
        }

        return res.status(201).json({
          success: true,
          message: "Akun berhasil dibuat. Selamat datang!",
          user: req.session.user,
        });
      });
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar.",
      });
    }
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
};
