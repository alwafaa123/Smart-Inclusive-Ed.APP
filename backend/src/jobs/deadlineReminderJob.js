const cron = require("node-cron");
const db = require("../config/db");

async function createDeadlineReminders() {
  try {
    // Cari tugas yang tenggatnya dalam 24 jam ke depan
    // dan belum melewati tenggat.
    const [rows] = await db.execute(
      `SELECT
         a.id AS assignment_id,
         a.title AS assignment_title,
         a.due_at,
         c.teacher_id,
         c.name AS class_name
       FROM assignments a
       JOIN classes c ON c.id = a.class_id
       WHERE a.due_at > NOW()
         AND a.due_at <= DATE_ADD(NOW(), INTERVAL 24 HOUR)
         AND NOT EXISTS (
           SELECT 1
           FROM notifications n
           WHERE n.user_id = c.teacher_id
             AND n.type = 'grading_reminder'
             AND n.related_id = a.id
             AND DATE(n.created_at) = CURDATE()
         )`,
    );

    for (const assignment of rows) {
      await db.execute(
        `INSERT INTO notifications
          (user_id, type, title, message, related_id)
         VALUES (?, 'grading_reminder', ?, ?, ?)`,
        [
          assignment.teacher_id,
          "Pengingat tenggat tugas",
          `Tugas "${assignment.assignment_title}" di kelas "${assignment.class_name}" mendekati tenggat.`,
          assignment.assignment_id,
        ],
      );
    }

    console.log(
      `Pemeriksaan tenggat selesai. Pengingat dibuat: ${rows.length}`,
    );
  } catch (error) {
    console.error("Deadline reminder job error:", error);
  }
}

function startDeadlineReminderJob() {
  // Periksa setiap jam.
  cron.schedule("0 * * * *", createDeadlineReminders);

  // Jalankan sekali saat server dimulai.
  createDeadlineReminders();
}

module.exports = { startDeadlineReminderJob };
