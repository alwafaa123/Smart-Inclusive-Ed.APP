require("dotenv").config();
const app = require("./src/app");
const { testConnection, pool } = require("./src/config/database");

const PORT = process.env.PORT || 5200;

async function startServer() {
  try {
    await testConnection();

    const server = app.listen(PORT, () => {
      console.log(`Smart Inclusive Ed berjalan di http://localhost:${PORT}`);
    });

    function shutdown() {
      server.close(async () => {
        await pool.end();
        console.log("Server dan koneksi database ditutup.");
        process.exit(0);
      });
    }

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error) {
    console.error("Server gagal dijalankan:", error);
    process.exit(1);
  }
}

startServer();
