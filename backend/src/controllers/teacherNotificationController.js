const db = require("../config/db");

// Mengambil notifikasi milik guru
exports.getTeacherNotifications = async (req, res) => {
  try {
    const teacherId = req.user.id; // ← pakai req.user

    const [notifications] = await db.execute(
      `SELECT
         n.id,
         n.type,
         n.title,
         n.message,
         n.related_id,
         n.is_read,
         n.created_at
       FROM notifications n
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 100`,
      [teacherId],
    );

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE user_id = ? AND is_read = 0`,
      [teacherId],
    );

    return res.json({
      notifications,
      unreadCount: countRows[0].unread_count,
    });
  } catch (error) {
    console.error("Get teacher notifications:", error);
    return res.status(500).json({
      message: "Gagal mengambil notifikasi guru.",
    });
  }
};

// Menandai satu notifikasi sebagai sudah dibaca
exports.markTeacherNotificationRead = async (req, res) => {
  try {
    const teacherId = req.user.id; // ← pakai req.user
    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({
        message: "ID notifikasi tidak valid.",
      });
    }

    const [result] = await db.execute(
      `UPDATE notifications
       SET is_read = 1
       WHERE id = ? AND user_id = ?`,
      [notificationId, teacherId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Notifikasi tidak ditemukan.",
      });
    }

    return res.json({ message: "Notifikasi ditandai sudah dibaca." });
  } catch (error) {
    console.error("Mark teacher notification:", error);
    return res.status(500).json({
      message: "Gagal memperbarui notifikasi.",
    });
  }
};

// Menandai seluruh notifikasi sebagai sudah dibaca
exports.markAllTeacherNotificationsRead = async (req, res) => {
  try {
    const teacherId = req.user.id; // ← pakai req.user

    await db.execute(
      `UPDATE notifications
       SET is_read = 1
       WHERE user_id = ? AND is_read = 0`,
      [teacherId],
    );

    return res.json({ message: "Seluruh notifikasi sudah ditandai dibaca." });
  } catch (error) {
    console.error("Mark all teacher notifications:", error);
    return res.status(500).json({
      message: "Gagal memperbarui notifikasi.",
    });
  }
};

// Ringkasan tugas yang menunggu penilaian
exports.getPendingGrading = async (req, res) => {
  try {
    const teacherId = req.user.id; // ← pakai req.user

    const [rows] = await db.execute(
      `SELECT
         a.id    AS assignment_id,
         a.title AS assignment_title,
         c.id    AS class_id,
         c.name  AS class_name,
         COUNT(s.id)        AS pending_count,
         MIN(s.submitted_at) AS first_submission
       FROM assignments a
       JOIN classes c    ON c.id = a.class_id
       JOIN submissions s ON s.assignment_id = a.id
       WHERE c.teacher_id = ?
         AND s.score IS NULL
       GROUP BY a.id, a.title, c.id, c.name
       ORDER BY first_submission ASC`,
      [teacherId],
    );

    return res.json({ pendingGrading: rows });
  } catch (error) {
    console.error("Get pending grading:", error);
    return res.status(500).json({
      message: "Gagal mengambil tugas yang menunggu penilaian.",
    });
  }
};
