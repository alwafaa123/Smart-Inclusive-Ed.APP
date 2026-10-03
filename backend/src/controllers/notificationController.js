const db = require("../config/db");

// Mengambil notifikasi milik pengguna yang sedang login
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // ← pakai req.user

    const [rows] = await db.execute(
      `SELECT
         id,
         type,
         title,
         message,
         related_id,
         is_read,
         created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId],
    );

    return res.json(rows);
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      message: "Gagal mengambil notifikasi.",
    });
  }
};

// Menghitung notifikasi yang belum dibaca
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id; // ← pakai req.user

    const [rows] = await db.execute(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE user_id = ? AND is_read = FALSE`,
      [userId],
    );

    return res.json({ unread_count: rows[0].unread_count });
  } catch (error) {
    console.error("Unread count error:", error);
    return res.status(500).json({
      message: "Gagal menghitung notifikasi.",
    });
  }
};

// Menandai satu notifikasi sebagai sudah dibaca
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id; // ← pakai req.user
    const { id } = req.params;

    const [result] = await db.execute(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = ? AND user_id = ?`,
      [id, userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Notifikasi tidak ditemukan.",
      });
    }

    return res.json({ message: "Notifikasi ditandai sudah dibaca." });
  } catch (error) {
    console.error("Mark notification error:", error);
    return res.status(500).json({
      message: "Gagal memperbarui notifikasi.",
    });
  }
};

// Menandai semua notifikasi sebagai sudah dibaca
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id; // ← pakai req.user

    await db.execute(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = ? AND is_read = FALSE`,
      [userId],
    );

    return res.json({ message: "Semua notifikasi telah dibaca." });
  } catch (error) {
    console.error("Mark all notifications error:", error);
    return res.status(500).json({
      message: "Gagal memperbarui notifikasi.",
    });
  }
};

// Pengingat tenggat yang dihitung ketika diminta.
exports.getUpcomingDeadlines = async (req, res) => {
  try {
    const studentId = req.user.id; // ← pakai req.user

    const [rows] = await db.execute(
      `SELECT
         a.id,
         a.class_id,
         a.title,
         a.due_at,
         s.id AS submission_id
       FROM assignments a
       JOIN class_members cm ON cm.class_id = a.class_id
       LEFT JOIN submissions s
         ON s.assignment_id = a.id
         AND s.student_id = cm.student_id
       WHERE cm.student_id = ?
         AND a.due_at IS NOT NULL
         AND a.due_at > NOW()
         AND a.due_at <= DATE_ADD(NOW(), INTERVAL 3 DAY)
         AND s.id IS NULL
       ORDER BY a.due_at ASC`,
      [studentId],
    );

    // ← Wrapper { deadlines } agar konsisten dengan yang dipakai frontend
    return res.json({ deadlines: rows });
  } catch (error) {
    console.error("Upcoming deadlines error:", error);
    return res.status(500).json({
      message: "Gagal mengambil pengingat tenggat.",
    });
  }
};
