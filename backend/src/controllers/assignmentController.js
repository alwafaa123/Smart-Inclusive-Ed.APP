const db = require("../config/db");

// Membuat tugas baru untuk kelas milik guru
exports.createAssignment = async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, instructions, due_at } = req.body;
    const teacherId = req.user.id; // ← pakai req.user (dari middleware db.js)

    if (!title || !instructions) {
      return res.status(400).json({
        message: "Judul dan instruksi tugas wajib diisi.",
      });
    }

    const [classes] = await db.execute(
      "SELECT id FROM classes WHERE id = ? AND teacher_id = ?",
      [classId, teacherId],
    );

    if (classes.length === 0) {
      return res.status(403).json({
        message: "Kelas tidak ditemukan atau bukan milik Anda.",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO assignments
       (class_id, title, instructions, due_at)
       VALUES (?, ?, ?, ?)`,
      [classId, title.trim(), instructions.trim(), due_at || null],
    );

    // Buat notifikasi ke setiap siswa di kelas ini
    try {
      const [members] = await db.execute(
        "SELECT student_id FROM class_members WHERE class_id = ?",
        [classId],
      );
      if (members.length > 0) {
        const values = members.map((m) => [
          m.student_id,
          "new_assignment",
          "Tugas Baru",
          `Tugas baru telah ditambahkan: ${title.trim()}`,
          result.insertId,
        ]);
        await db.query(
          `INSERT INTO notifications (user_id, type, title, message, related_id)
           VALUES ?`,
          [values],
        );
      }
    } catch (_) {
      // Kegagalan notifikasi tidak mengganggu pembuatan tugas
    }

    return res.status(201).json({
      message: "Tugas berhasil dibuat.",
      assignment: {
        id: result.insertId,
        class_id: Number(classId),
        title: title.trim(),
        instructions: instructions.trim(),
        due_at: due_at || null,
      },
    });
  } catch (error) {
    console.error("Create assignment error:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat membuat tugas.",
    });
  }
};

// Menampilkan tugas dalam suatu kelas
exports.getClassAssignments = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id; // ← pakai req.user
    const role   = req.user.role;

    let accessQuery, accessParams;

    if (role === "teacher") {
      accessQuery  = "SELECT id FROM classes WHERE id = ? AND teacher_id = ?";
      accessParams = [classId, userId];
    } else {
      accessQuery = `
        SELECT c.id
        FROM classes c
        JOIN class_members cm ON cm.class_id = c.id
        WHERE c.id = ? AND cm.student_id = ?
      `;
      accessParams = [classId, userId];
    }

    const [access] = await db.execute(accessQuery, accessParams);

    if (access.length === 0) {
      return res.status(403).json({
        message: "Anda tidak memiliki akses ke kelas ini.",
      });
    }

    const [assignments] = await db.execute(
      `SELECT
         a.id,
         a.class_id,
         a.title,
         a.instructions,
         a.due_at,
         a.created_at,
         a.updated_at
       FROM assignments a
       WHERE a.class_id = ?
       ORDER BY a.created_at DESC`,
      [classId],
    );

    // Kembalikan dengan wrapper { assignments } agar konsisten dengan frontend
    return res.json({ assignments });
  } catch (error) {
    console.error("Get assignments error:", error);
    return res.status(500).json({
      message: "Gagal mengambil daftar tugas.",
    });
  }
};

// Mengedit tugas milik guru
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, instructions, due_at } = req.body;
    const teacherId = req.user.id; // ← pakai req.user

    if (!title || !instructions) {
      return res.status(400).json({
        message: "Judul dan instruksi tugas wajib diisi.",
      });
    }

    const [result] = await db.execute(
      `UPDATE assignments a
       JOIN classes c ON c.id = a.class_id
       SET a.title = ?,
           a.instructions = ?,
           a.due_at = ?
       WHERE a.id = ? AND c.teacher_id = ?`,
      [title.trim(), instructions.trim(), due_at || null, id, teacherId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Tugas tidak ditemukan atau tidak dapat diubah.",
      });
    }

    return res.json({ message: "Tugas berhasil diperbarui." });
  } catch (error) {
    console.error("Update assignment error:", error);
    return res.status(500).json({
      message: "Gagal memperbarui tugas.",
    });
  }
};

// Menghapus tugas milik guru
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id; // ← pakai req.user

    const [result] = await db.execute(
      `DELETE a FROM assignments a
       JOIN classes c ON c.id = a.class_id
       WHERE a.id = ? AND c.teacher_id = ?`,
      [id, teacherId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Tugas tidak ditemukan atau tidak dapat dihapus.",
      });
    }

    return res.json({ message: "Tugas berhasil dihapus." });
  } catch (error) {
    console.error("Delete assignment error:", error);
    return res.status(500).json({
      message: "Gagal menghapus tugas.",
    });
  }
};

// Siswa mengumpulkan atau memperbarui jawaban
exports.submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id; // ← pakai req.user
    const { answer } = req.body;

    if (!answer || !answer.trim()) {
      return res.status(400).json({
        message: "Jawaban tugas tidak boleh kosong.",
      });
    }

    const [assignments] = await db.execute(
      `SELECT a.id, a.due_at, a.title, a.class_id
       FROM assignments a
       JOIN class_members cm ON cm.class_id = a.class_id
       WHERE a.id = ? AND cm.student_id = ?`,
      [id, studentId],
    );

    if (assignments.length === 0) {
      return res.status(403).json({
        message: "Tugas tidak ditemukan atau Anda bukan anggota kelas.",
      });
    }

    const assignment = assignments[0];

    if (
      assignment.due_at &&
      new Date(assignment.due_at).getTime() < Date.now()
    ) {
      return res.status(400).json({
        message: "Tenggat waktu tugas telah berakhir.",
      });
    }

    const [existing] = await db.execute(
      "SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?",
      [id, studentId],
    );

    if (existing.length > 0) {
      await db.execute(
        `UPDATE submissions
         SET answer = ?, submitted_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [answer.trim(), existing[0].id],
      );
    } else {
      await db.execute(
        `INSERT INTO submissions
         (assignment_id, student_id, answer, submitted_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [id, studentId, answer.trim()],
      );
    }

    return res.json({ message: "Jawaban berhasil dikumpulkan." });
  } catch (error) {
    console.error("Submit assignment error:", error);
    return res.status(500).json({
      message: "Gagal mengumpulkan jawaban.",
    });
  }
};

// Siswa melihat jawaban dan umpan balik miliknya
exports.getMySubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id; // ← pakai req.user

    const [rows] = await db.execute(
      `SELECT
         s.id,
         s.assignment_id,
         s.answer,
         s.score,
         s.feedback,
         s.submitted_at,
         s.updated_at
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       JOIN class_members cm ON cm.class_id = a.class_id
       WHERE s.assignment_id = ?
         AND s.student_id = ?
         AND cm.student_id = ?`,
      [id, studentId, studentId],
    );

    return res.json(rows[0] || null);
  } catch (error) {
    console.error("Get my submission error:", error);
    return res.status(500).json({
      message: "Gagal mengambil data pengumpulan.",
    });
  }
};

// Guru melihat semua jawaban untuk suatu tugas
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id; // ← pakai req.user

    const [assignments] = await db.execute(
      `SELECT a.id
       FROM assignments a
       JOIN classes c ON c.id = a.class_id
       WHERE a.id = ? AND c.teacher_id = ?`,
      [id, teacherId],
    );

    if (assignments.length === 0) {
      return res.status(404).json({
        message: "Tugas tidak ditemukan atau bukan milik Anda.",
      });
    }

    const [submissions] = await db.execute(
      `SELECT
         s.id,
         s.student_id,
         u.name  AS student_name,
         u.email AS student_email,
         s.answer,
         s.score,
         s.feedback,
         s.submitted_at,
         s.updated_at
       FROM submissions s
       JOIN users u ON u.id = s.student_id
       WHERE s.assignment_id = ?
       ORDER BY s.submitted_at DESC`,
      [id],
    );

    return res.json(submissions);
  } catch (error) {
    console.error("Get submissions error:", error);
    return res.status(500).json({
      message: "Gagal mengambil daftar pengumpulan.",
    });
  }
};

// Guru memberikan nilai dan umpan balik
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback } = req.body;
    const teacherId = req.user.id; // ← pakai req.user

    if (
      score === undefined ||
      score === null ||
      score === "" ||
      !Number.isFinite(Number(score)) ||
      Number(score) < 0 ||
      Number(score) > 100
    ) {
      return res.status(400).json({
        message: "Nilai harus berupa angka dari 0 sampai 100.",
      });
    }

    const [result] = await db.execute(
      `UPDATE submissions s
       JOIN assignments a ON a.id = s.assignment_id
       JOIN classes c ON c.id = a.class_id
       SET s.score = ?, s.feedback = ?
       WHERE s.id = ? AND c.teacher_id = ?`,
      [Number(score), feedback || null, submissionId, teacherId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Data pengumpulan tidak ditemukan.",
      });
    }

    // Buat notifikasi "graded" ke siswa
    try {
      const [rows] = await db.execute(
        `SELECT s.student_id, a.title
         FROM submissions s
         JOIN assignments a ON a.id = s.assignment_id
         WHERE s.id = ?`,
        [submissionId],
      );
      if (rows.length > 0) {
        await db.execute(
          `INSERT INTO notifications (user_id, type, title, message, related_id)
           VALUES (?, 'graded', 'Tugas Dinilai',
                   ?, s.assignment_id)`,
          // Pakai query terpisah agar lebih aman
          [],
        );
        await db.execute(
          `INSERT INTO notifications (user_id, type, title, message, related_id)
           VALUES (?, 'graded', 'Tugas Dinilai', ?, ?)`,
          [
            rows[0].student_id,
            `Tugasmu "${rows[0].title}" telah dinilai. Cek hasilnya sekarang.`,
            Number(submissionId),
          ],
        );
      }
    } catch (_) {
      // Kegagalan notifikasi tidak mengganggu penilaian
    }

    return res.json({ message: "Nilai dan umpan balik berhasil disimpan." });
  } catch (error) {
    console.error("Grade submission error:", error);
    return res.status(500).json({
      message: "Gagal menyimpan penilaian.",
    });
  }
};

// Statistik tugas (endpoint opsional, belum ada route)
exports.getAssignmentStats = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;
    const periodStart = startDate || "1000-01-01";
    const periodEnd   = endDate   || "9999-12-31";

    const [stats] = await db.execute(
      `SELECT COUNT(*) AS total_assignments
       FROM assignments a
       WHERE a.class_id = ?
         AND DATE(a.created_at) BETWEEN ? AND ?`,
      [classId, periodStart, periodEnd],
    );

    return res.json(stats[0]);
  } catch (error) {
    console.error("Get assignment stats error:", error);
    return res.status(500).json({ message: "Gagal mengambil statistik tugas." });
  }
};

// Progres siswa per periode (endpoint opsional, belum ada route)
exports.getStudentProgress = async (req, res) => {
  try {
    const { classId } = req.params;
    const { periodStart, periodEnd } = req.query;

    const [progressData] = await db.execute(
      `SELECT
         cm.student_id,
         u.name,
         COUNT(s.id) AS total_submissions
       FROM class_members cm
       JOIN users u ON u.id = cm.student_id
       LEFT JOIN assignments a
         ON a.class_id = cm.class_id
         AND DATE(a.created_at) BETWEEN ? AND ?
       LEFT JOIN submissions s
         ON s.assignment_id = a.id AND s.student_id = cm.student_id
       WHERE cm.class_id = ?
       GROUP BY cm.student_id, u.name`,
      [periodStart || "1000-01-01", periodEnd || "9999-12-31", classId],
    );

    return res.json(progressData);
  } catch (error) {
    console.error("Get student progress error:", error);
    return res.status(500).json({ message: "Gagal mengambil data progress." });
  }
};
