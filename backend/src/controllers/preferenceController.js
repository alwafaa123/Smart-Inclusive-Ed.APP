const pool = require("../config/db");

// Mengambil preferensi aksesibilitas pengguna yang sedang login.
exports.getMyPreferences = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT font_size, line_spacing, high_contrast,
              dyslexia_friendly_font, text_to_speech
       FROM accessibility_preferences
       WHERE user_id = ?
       LIMIT 1`,
      [req.user.id],
    );

    // Gunakan nilai bawaan jika pengguna belum memiliki preferensi.
    const preferences = rows[0] || {
      font_size: 18,
      line_spacing: 1.8,
      high_contrast: 0,
      dyslexia_friendly_font: 0,
      text_to_speech: 0,
    };

    return res.json({ preferences });
  } catch (error) {
    console.error("Get preferences error:", error);
    return res.status(500).json({
      message: "Gagal mengambil pengaturan aksesibilitas.",
    });
  }
};

// Memperbarui preferensi pengguna yang sedang login.
exports.updateMyPreferences = async (req, res) => {
  try {
    const {
      font_size,
      line_spacing,
      high_contrast,
      dyslexia_friendly_font,
      text_to_speech,
    } = req.body;

    const fontSize = Number(font_size);
    const lineSpacing = Number(line_spacing);

    if (!Number.isInteger(fontSize) || fontSize < 14 || fontSize > 32) {
      return res.status(400).json({
        message: "Ukuran teks harus berupa bilangan bulat antara 14 dan 32.",
      });
    }

    if (![1.5, 1.8, 2.2].includes(lineSpacing)) {
      return res.status(400).json({
        message: "Pilihan jarak baris tidak valid.",
      });
    }

    const isBoolean = (value) =>
      value === true || value === false || value === 0 || value === 1;

    if (
      !isBoolean(high_contrast) ||
      !isBoolean(dyslexia_friendly_font) ||
      !isBoolean(text_to_speech)
    ) {
      return res.status(400).json({
        message: "Pengaturan aksesibilitas harus berupa nilai boolean.",
      });
    }

    const toNumber = (value) => (value === true || value === 1 ? 1 : 0);

    await pool.execute(
      `INSERT INTO accessibility_preferences
       (user_id, font_size, line_spacing, high_contrast,
        dyslexia_friendly_font, text_to_speech)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         font_size = VALUES(font_size),
         line_spacing = VALUES(line_spacing),
         high_contrast = VALUES(high_contrast),
         dyslexia_friendly_font = VALUES(dyslexia_friendly_font),
         text_to_speech = VALUES(text_to_speech)`,
      [
        req.user.id,
        fontSize,
        lineSpacing,
        toNumber(high_contrast),
        toNumber(dyslexia_friendly_font),
        toNumber(text_to_speech),
      ],
    );

    return res.json({
      message: "Pengaturan aksesibilitas berhasil disimpan.",
      preferences: {
        font_size: fontSize,
        line_spacing: lineSpacing,
        high_contrast: toNumber(high_contrast),
        dyslexia_friendly_font: toNumber(dyslexia_friendly_font),
        text_to_speech: toNumber(text_to_speech),
      },
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    return res.status(500).json({
      message: "Gagal menyimpan pengaturan aksesibilitas.",
    });
  }
};
