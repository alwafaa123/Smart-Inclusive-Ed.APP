require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool } = require("./src/config/database");

async function createAccount() {
  try {
    const rawPassword = "PasswordUji123!";
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

    const query = `
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE password_hash = ?, role = ?
    `;

    await pool.execute(query, [
      "Admin Uji",
      "admin@smartinclusive.test",
      passwordHash,
      "admin",
      true,
      passwordHash,
      "admin",
    ]);

    console.log("Akun uji berhasil dibuat/diperbarui!");
    console.log("Email: admin@smartinclusive.test");
    console.log("Password: PasswordUji123!");
    process.exit(0);
  } catch (error) {
    console.error("Gagal membuat akun uji:", error.message);
    process.exit(1);
  }
}

createAccount();
