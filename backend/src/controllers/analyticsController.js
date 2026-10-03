const db = require("../config/db");

// Ringkasan analitik untuk satu kelas
exports.getClassAnalytics = async (req, res) => {
  try {
    const classId   = Number(req.params.classId);
    const teacherId = req.user.id; // ← pakai req.user

    if (!Number.isInteger(classId) || classId <= 0) {
      return res.status(400).json({
        message: "ID kelas tidak valid.",
      });
    }

    // Pastikan kelas dimiliki oleh guru yang sedang login
    const [classes] = await db.execute(
      "SELECT id, name FROM classes WHERE id = ? AND teacher_id = ?",
      [classId, teacherId],
    );

    if (classes.length === 0) {
      return res.status(404).json({
        message: "Kelas tidak ditemukan.",
      });
    }

    // Ringkasan kelas
    const [classSummary] = await db.execute(
      `SELECT
         (SELECT COUNT(*) FROM class_members  WHERE class_id = ?) AS total_students,
         (SELECT COUNT(*) FROM modules        WHERE class_id = ?) AS total_modules,
         (SELECT COUNT(*) FROM assignments    WHERE class_id = ?) AS total_assignments`,
      [classId, classId, classId],
    );

    // Progres setiap materi
    const [moduleProgress] = await db.execute(
      `SELECT
         m.id    AS module_id,
         m.title AS module_title,
         COUNT(cm.student_id) AS total_students,
         SUM(CASE WHEN mp.status = 'completed'  THEN 1 ELSE 0 END) AS completed,
         SUM(CASE WHEN mp.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
         SUM(CASE WHEN mp.status IS NULL OR mp.status = 'not_started' THEN 1 ELSE 0 END) AS not_started
       FROM modules m
       LEFT JOIN class_members cm ON cm.class_id = m.class_id
       LEFT JOIN module_progress mp
         ON mp.module_id = m.id AND mp.student_id = cm.student_id
       WHERE m.class_id = ?
       GROUP BY m.id, m.title
       ORDER BY m.created_at DESC`,
      [classId],
    );

    // Statistik pengumpulan tugas
    const [assignmentStats] = await db.execute(
      `SELECT
         a.id    AS assignment_id,
         a.title AS assignment_title,
         COUNT(cm.student_id)                          AS total_students,
         COUNT(s.id)                                   AS submitted,
         SUM(CASE WHEN s.id IS NULL THEN 1 ELSE 0 END) AS not_submitted,
         ROUND(AVG(s.score), 2)                        AS average_score
       FROM assignments a
       LEFT JOIN class_members cm ON cm.class_id = a.class_id
       LEFT JOIN submissions s
         ON s.assignment_id = a.id AND s.student_id = cm.student_id
       WHERE a.class_id = ?
       GROUP BY a.id, a.title
       ORDER BY a.created_at DESC`,
      [classId],
    );

    // Progres setiap siswa
    const [studentProgress] = await db.execute(
      `SELECT
         u.id    AS student_id,
         u.name  AS student_name,
         u.email,
         COUNT(DISTINCT m.id)                                      AS total_modules,
         COUNT(DISTINCT CASE WHEN mp.status = 'completed' THEN m.id END) AS completed_modules,
         COUNT(DISTINCT a.id)                                      AS total_assignments,
         COUNT(DISTINCT s.id)                                      AS submitted_assignments,
         ROUND(AVG(s.score), 2)                                    AS average_score
       FROM class_members cm
       JOIN users u ON u.id = cm.student_id
       LEFT JOIN modules m
         ON m.class_id = cm.class_id AND m.is_published = 1
       LEFT JOIN module_progress mp
         ON mp.module_id = m.id AND mp.student_id = u.id
       LEFT JOIN assignments a ON a.class_id = cm.class_id
       LEFT JOIN submissions s
         ON s.assignment_id = a.id AND s.student_id = u.id
       WHERE cm.class_id = ?
       GROUP BY u.id, u.name, u.email
       ORDER BY u.name ASC`,
      [classId],
    );

    return res.status(200).json({
      class: classes[0],
      summary: classSummary[0],
      moduleProgress,
      assignmentStats,
      studentProgress,
    });
  } catch (error) {
    console.error("Get class analytics error:", error);
    return res.status(500).json({
      message: "Gagal mengambil data analitik kelas.",
    });
  }
};
