const pool = require("../config/db");
const crypto = require("crypto");

// Membuat kode kelas yang mudah dibagikan.
function generateClassCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

// Guru membuat kelas.
exports.createClass = async (req, res) => {
  try {
    const { name, description = "" } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Nama kelas wajib diisi.",
      });
    }

    const teacherId = req.user.id;
    let classCode;
    let result;

    // Ulangi jika kode kelas kebetulan sudah digunakan.
    for (let attempt = 0; attempt < 5; attempt++) {
      classCode = generateClassCode();

      try {
        [result] = await pool.execute(
          `INSERT INTO classes (teacher_id, name, description, class_code)
           VALUES (?, ?, ?, ?)`,
          [teacherId, name.trim(), description.trim(), classCode],
        );
        break;
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY" || attempt === 4) {
          throw error;
        }
      }
    }

    return res.status(201).json({
      message: "Kelas berhasil dibuat.",
      class: {
        id: result.insertId,
        teacher_id: teacherId,
        name: name.trim(),
        description: description.trim(),
        class_code: classCode,
      },
    });
  } catch (error) {
    console.error("Create class error:", error);
    return res.status(500).json({
      message: "Gagal membuat kelas.",
    });
  }
};

// Guru melihat kelas miliknya; siswa melihat kelas yang diikuti.
exports.getMyClasses = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role === "teacher") {
      const [classes] = await pool.execute(
        `SELECT c.id, c.name, c.description, c.class_code,
                c.created_at,
                COUNT(cm.student_id) AS student_count
         FROM classes c
         LEFT JOIN class_members cm ON cm.class_id = c.id
         WHERE c.teacher_id = ?
         GROUP BY c.id
         ORDER BY c.created_at DESC`,
        [userId],
      );

      return res.json({ classes });
    }

    if (req.user.role === "student") {
      const [classes] = await pool.execute(
        `SELECT c.id, c.name, c.description, c.class_code,
                c.created_at, u.name AS teacher_name
         FROM class_members cm
         JOIN classes c ON c.id = cm.class_id
         JOIN users u ON u.id = c.teacher_id
         WHERE cm.student_id = ?
         ORDER BY cm.joined_at DESC`,
        [userId],
      );

      return res.json({ classes });
    }

    return res.status(403).json({
      message: "Peran pengguna tidak dapat melihat daftar kelas.",
    });
  } catch (error) {
    console.error("Get classes error:", error);
    return res.status(500).json({
      message: "Gagal mengambil daftar kelas.",
    });
  }
};

// Guru melihat anggota dari kelas miliknya.
exports.getClassMembers = async (req, res) => {
  try {
    const classId = req.params.id;

    const [classes] = await pool.execute(
      "SELECT id FROM classes WHERE id = ? AND teacher_id = ?",
      [classId, req.user.id],
    );

    if (classes.length === 0) {
      return res.status(404).json({
        message: "Kelas tidak ditemukan atau bukan milik Anda.",
      });
    }

    const [students] = await pool.execute(
      `SELECT u.id, u.name, u.email, cm.joined_at
       FROM class_members cm
       JOIN users u ON u.id = cm.student_id
       WHERE cm.class_id = ?
       ORDER BY cm.joined_at DESC`,
      [classId],
    );

    return res.json({ students });
  } catch (error) {
    console.error("Get class members error:", error);
    return res.status(500).json({
      message: "Gagal mengambil anggota kelas.",
    });
  }
};

// Siswa bergabung menggunakan kode kelas.
exports.joinClass = async (req, res) => {
  try {
    const { class_code } = req.body;

    if (!class_code || !class_code.trim()) {
      return res.status(400).json({
        message: "Kode kelas wajib diisi.",
      });
    }

    const [classes] = await pool.execute(
      "SELECT id, name FROM classes WHERE class_code = ?",
      [class_code.trim().toUpperCase()],
    );

    if (classes.length === 0) {
      return res.status(404).json({
        message: "Kode kelas tidak ditemukan.",
      });
    }

    const classroom = classes[0];

    try {
      await pool.execute(
        "INSERT INTO class_members (class_id, student_id) VALUES (?, ?)",
        [classroom.id, req.user.id],
      );
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          message: "Anda sudah bergabung dengan kelas ini.",
        });
      }
      throw error;
    }

    return res.status(201).json({
      message: "Berhasil bergabung dengan kelas.",
      class: classroom,
    });
  } catch (error) {
    console.error("Join class error:", error);
    return res.status(500).json({
      message: "Gagal bergabung dengan kelas.",
    });
  }
};

// Guru mengeluarkan siswa dari kelas miliknya.
exports.removeStudent = async (req, res) => {
  try {
    const { id: classId, studentId } = req.params;

    const [result] = await pool.execute(
      `DELETE cm FROM class_members cm
       JOIN classes c ON c.id = cm.class_id
       WHERE cm.class_id = ?
         AND cm.student_id = ?
         AND c.teacher_id = ?`,
      [classId, studentId, req.user.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Anggota tidak ditemukan atau kelas bukan milik Anda.",
      });
    }

    return res.json({
      message: "Siswa berhasil dikeluarkan dari kelas.",
    });
  } catch (error) {
    console.error("Remove student error:", error);
    return res.status(500).json({
      message: "Gagal mengeluarkan siswa dari kelas.",
    });
  }
};
