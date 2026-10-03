const pool = require("../config/db");
const {
  attachmentData,
  discardUploadedFile,
  removeStoredFile,
  sendStoredFile,
} = require("../middleware/attachmentUpload");

// Memeriksa apakah guru memiliki kelas tersebut.
async function isClassOwner(classId, teacherId) {
  const [rows] = await pool.execute(
    "SELECT id FROM classes WHERE id = ? AND teacher_id = ?",
    [classId, teacherId],
  );

  return rows.length > 0;
}

// Guru membuat materi baru.
exports.createModule = async (req, res) => {
  try {
    const { classId } = req.params;
    const {
      title,
      description = "",
      content,
      content_type = "text",
    } = req.body;

    if (!title?.trim() || !content?.trim()) {
      discardUploadedFile(req);
      return res.status(400).json({
        message: "Judul dan isi materi wajib diisi.",
      });
    }

    const allowedTypes = ["text", "video", "audio", "mixed"];

    if (!allowedTypes.includes(content_type)) {
      discardUploadedFile(req);
      return res.status(400).json({
        message: "Jenis materi tidak valid.",
      });
    }

    const owned = await isClassOwner(classId, req.user.id);

    if (!owned) {
      discardUploadedFile(req);
      return res.status(404).json({
        message: "Kelas tidak ditemukan atau bukan milik Anda.",
      });
    }

    const attachment = attachmentData(req.file);
    const [result] = await pool.execute(
      `INSERT INTO modules
       (class_id, title, description, content, content_type, is_published,
        attachment_path, attachment_name, attachment_type)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        classId,
        title.trim(),
        description.trim(),
        content.trim(),
        content_type,
        attachment?.attachment_path || null,
        attachment?.attachment_name || null,
        attachment?.attachment_type || null,
      ],
    );

    return res.status(201).json({
      message: "Materi berhasil dibuat sebagai draf.",
      module: {
        id: result.insertId,
        class_id: Number(classId),
        title: title.trim(),
        description: description.trim(),
        content,
        content_type,
        is_published: 0,
        ...attachment,
      },
    });
  } catch (error) {
    discardUploadedFile(req);
    console.error("Create module error:", error);
    return res.status(500).json({
      message: "Gagal membuat materi.",
    });
  }
};

// Guru melihat semua materi kelasnya.
// Siswa hanya melihat materi yang sudah diterbitkan.
exports.getClassModules = async (req, res) => {
  try {
    const { classId } = req.params;
    let query;
    let params;

    if (req.user.role === "teacher") {
      query = `
        SELECT m.id, m.class_id, m.title, m.description,
               m.content, m.content_type, m.is_published,
               m.attachment_name, m.attachment_type,
               m.created_at, m.updated_at
        FROM modules m
        JOIN classes c ON c.id = m.class_id
        WHERE m.class_id = ? AND c.teacher_id = ?
        ORDER BY m.created_at DESC
      `;
      params = [classId, req.user.id];
    } else {
      query = `
        SELECT m.id, m.class_id, m.title, m.description,
               m.content, m.content_type, m.is_published,
               m.attachment_name, m.attachment_type,
               m.created_at, m.updated_at
        FROM modules m
        JOIN class_members cm ON cm.class_id = m.class_id
        WHERE m.class_id = ?
          AND cm.student_id = ?
          AND m.is_published = 1
        ORDER BY m.created_at DESC
      `;
      params = [classId, req.user.id];
    }

    const [modules] = await pool.execute(query, params);
    return res.json({ modules });
  } catch (error) {
    console.error("Get class modules error:", error);
    return res.status(500).json({
      message: "Gagal mengambil daftar materi.",
    });
  }
};

// Mengambil satu materi dengan pemeriksaan akses.
exports.getModuleById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT m.id, m.class_id, m.title, m.description,
              m.content, m.content_type, m.is_published,
              m.attachment_path, m.attachment_name, m.attachment_type,
              m.created_at, m.updated_at
       FROM modules m
       WHERE m.id = ?`,
      [id],
    );

    const module = rows[0];

    if (!module) {
      return res.status(404).json({
        message: "Materi tidak ditemukan.",
      });
    }

    let hasAccess = false;

    if (req.user.role === "teacher") {
      hasAccess = await isClassOwner(module.class_id, req.user.id);
    } else if (
      req.user.role === "student" &&
      Number(module.is_published) === 1
    ) {
      const [members] = await pool.execute(
        `SELECT class_id FROM class_members
         WHERE class_id = ? AND student_id = ?`,
        [module.class_id, req.user.id],
      );

      hasAccess = members.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({
        message: "Anda tidak memiliki akses ke materi ini.",
      });
    }

    return res.json({ module });
  } catch (error) {
    console.error("Get module error:", error);
    return res.status(500).json({
      message: "Gagal mengambil materi.",
    });
  }
};

exports.downloadModuleAttachment = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.class_id, m.is_published, m.attachment_path, m.attachment_name
       FROM modules m WHERE m.id = ?`,
      [req.params.id],
    );
    const module = rows[0];

    if (!module?.attachment_path) {
      return res.status(404).json({ message: "Lampiran materi tidak ditemukan." });
    }

    let hasAccess = false;
    if (req.user.role === "teacher") {
      hasAccess = await isClassOwner(module.class_id, req.user.id);
    } else if (req.user.role === "student" && Number(module.is_published) === 1) {
      const [members] = await pool.execute(
        "SELECT class_id FROM class_members WHERE class_id = ? AND student_id = ?",
        [module.class_id, req.user.id],
      );
      hasAccess = members.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({ message: "Anda tidak memiliki akses ke lampiran ini." });
    }

    return sendStoredFile(
      res,
      module.attachment_path,
      module.attachment_name,
      "Lampiran materi tidak ditemukan.",
    );
  } catch (error) {
    console.error("Download module attachment error:", error);
    return res.status(500).json({ message: "Gagal mengunduh lampiran materi." });
  }
};

// Guru mengedit materi miliknya.
exports.updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description = "", content, content_type } = req.body;

    if (!title?.trim() || !content?.trim()) {
      discardUploadedFile(req);
      return res.status(400).json({
        message: "Judul dan isi materi wajib diisi.",
      });
    }

    const allowedTypes = ["text", "video", "audio", "mixed"];

    if (!allowedTypes.includes(content_type)) {
      discardUploadedFile(req);
      return res.status(400).json({
        message: "Jenis materi tidak valid.",
      });
    }

    const [existing] = await pool.execute(
      `SELECT m.attachment_path
       FROM modules m
       JOIN classes c ON c.id = m.class_id
       WHERE m.id = ? AND c.teacher_id = ?`,
      [id, req.user.id],
    );

    if (existing.length === 0) {
      discardUploadedFile(req);
      return res.status(404).json({
        message: "Materi tidak ditemukan atau bukan milik Anda.",
      });
    }

    const attachment = attachmentData(req.file);
    await pool.execute(
      `UPDATE modules m
       JOIN classes c ON c.id = m.class_id
       SET m.title = ?, m.description = ?, m.content = ?,
           m.content_type = ?,
           m.attachment_path = COALESCE(?, m.attachment_path),
           m.attachment_name = COALESCE(?, m.attachment_name),
           m.attachment_type = COALESCE(?, m.attachment_type)
       WHERE m.id = ? AND c.teacher_id = ?`,
      [
        title.trim(),
        description.trim(),
        content.trim(),
        content_type,
        attachment?.attachment_path || null,
        attachment?.attachment_name || null,
        attachment?.attachment_type || null,
        id,
        req.user.id,
      ],
    );

    if (attachment && existing[0].attachment_path) {
      removeStoredFile(existing[0].attachment_path);
    }

    return res.json({ message: "Materi berhasil diperbarui." });
  } catch (error) {
    discardUploadedFile(req);
    console.error("Update module error:", error);
    return res.status(500).json({
      message: "Gagal memperbarui materi.",
    });
  }
};

// Guru menerbitkan atau menyembunyikan materi.
exports.setModulePublished = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;

    if (![true, false, 0, 1].includes(is_published)) {
      return res.status(400).json({
        message: "Status publikasi harus berupa true atau false.",
      });
    }

    const published = is_published === true || is_published === 1 ? 1 : 0;

    const [result] = await pool.execute(
      `UPDATE modules m
       JOIN classes c ON c.id = m.class_id
       SET m.is_published = ?
       WHERE m.id = ? AND c.teacher_id = ?`,
      [published, id, req.user.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Materi tidak ditemukan atau bukan milik Anda.",
      });
    }

    return res.json({
      message: published
        ? "Materi berhasil diterbitkan."
        : "Materi berhasil disembunyikan.",
    });
  } catch (error) {
    console.error("Publish module error:", error);
    return res.status(500).json({
      message: "Gagal mengubah status publikasi.",
    });
  }
};

// Guru menghapus materi miliknya.
exports.deleteModule = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      `SELECT m.attachment_path
       FROM modules m
       JOIN classes c ON c.id = m.class_id
       WHERE m.id = ? AND c.teacher_id = ?`,
      [id, req.user.id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: "Materi tidak ditemukan atau bukan milik Anda.",
      });
    }

    await pool.execute(
      `DELETE m FROM modules m
       JOIN classes c ON c.id = m.class_id
       WHERE m.id = ? AND c.teacher_id = ?`,
      [id, req.user.id],
    );

    if (existing[0].attachment_path) removeStoredFile(existing[0].attachment_path);

    return res.json({ message: "Materi berhasil dihapus." });
  } catch (error) {
    console.error("Delete module error:", error);
    return res.status(500).json({
      message: "Gagal menghapus materi.",
    });
  }
};

// Siswa memperbarui progres belajar.
exports.updateProgress = async (req, res) => {
  try {
    const { id: moduleId } = req.params;
    const { status } = req.body;
    const allowedStatuses = ["in_progress", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status progres tidak valid.",
      });
    }

    const [modules] = await pool.execute(
      `SELECT m.id
       FROM modules m
       JOIN class_members cm ON cm.class_id = m.class_id
       WHERE m.id = ?
         AND cm.student_id = ?
         AND m.is_published = 1`,
      [moduleId, req.user.id],
    );

    if (modules.length === 0) {
      return res.status(404).json({
        message: "Materi tidak ditemukan atau Anda belum memiliki akses.",
      });
    }

    await pool.execute(
      `INSERT INTO module_progress
       (module_id, student_id, status, last_accessed_at, completed_at)
       VALUES (?, ?, ?, NOW(), ?)
       ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         last_accessed_at = NOW(),
         completed_at = VALUES(completed_at)`,
      [
        moduleId,
        req.user.id,
        status,
        status === "completed" ? new Date() : null,
      ],
    );

    return res.json({
      message: "Progres belajar berhasil diperbarui.",
      status,
    });
  } catch (error) {
    console.error("Update progress error:", error);
    return res.status(500).json({
      message: "Gagal memperbarui progres belajar.",
    });
  }
};

// Siswa melihat progres belajarnya untuk suatu kelas.
exports.getMyProgress = async (req, res) => {
  try {
    const { classId } = req.params;

    const [rows] = await pool.execute(
      `SELECT m.id AS module_id, m.title, m.description,
              m.content_type, mp.status, mp.last_accessed_at,
              mp.completed_at
       FROM modules m
       JOIN class_members cm ON cm.class_id = m.class_id
       LEFT JOIN module_progress mp
         ON mp.module_id = m.id AND mp.student_id = cm.student_id
       WHERE m.class_id = ?
         AND cm.student_id = ?
         AND m.is_published = 1
       ORDER BY m.created_at DESC`,
      [classId, req.user.id],
    );

    return res.json({
      progress: rows.map((row) => ({
        ...row,
        status: row.status || "not_started",
      })),
    });
  } catch (error) {
    console.error("Get progress error:", error);
    return res.status(500).json({
      message: "Gagal mengambil progres belajar.",
    });
  }
};
