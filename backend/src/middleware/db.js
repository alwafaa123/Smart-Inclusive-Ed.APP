const pool = require("../config/db");

function destroySession(req) {
  return new Promise((resolve) => {
    if (!req.session) return resolve();

    req.session.destroy(() => resolve());
  });
}

// Memastikan pengguna memiliki sesi dan akun yang masih aktif.
async function loadActiveUser(req, res, next) {
  try {
    const sessionUserId = req.session?.user?.id;

    if (!sessionUserId) {
      return res.status(401).json({
        message: "Silakan login terlebih dahulu.",
      });
    }

    const [rows] = await pool.execute(
      `SELECT id, name, email, role, is_active
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [sessionUserId],
    );

    const user = rows[0];

    if (!user || Number(user.is_active) !== 1) {
      await destroySession(req);

      res.clearCookie(process.env.SESSION_NAME || "smartinclusive.sid");

      return res.status(401).json({
        message: "Sesi berakhir atau akun tidak aktif. Silakan login kembali.",
      });
    }

    // Perbarui data sesi agar selalu mengikuti data terbaru di database.
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    req.user = req.session.user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan saat memeriksa autentikasi.",
    });
  }
}

// Untuk endpoint yang hanya membutuhkan login.
function requireAuth(req, res, next) {
  return loadActiveUser(req, res, next);
}

// Untuk endpoint yang membutuhkan peran tertentu.
function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    await loadActiveUser(req, res, (error) => {
      if (error) return next(error);

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          message: "Anda tidak memiliki izin untuk mengakses fitur ini.",
        });
      }

      next();
    });
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
