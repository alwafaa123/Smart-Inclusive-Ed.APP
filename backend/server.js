require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const app = require("./src/app");
const { testConnection, pool } = require("./src/config/database");

const PORT = process.env.PORT || 5200;

async function startServer() {
  try {
    await testConnection();

    const server = app.listen(PORT, () => {
      console.log(`Smart Inclusive Ed berjalan di http://localhost:${PORT}`);
    });

    // Penanganan penghentian server
    process.on("SIGINT", () => {
      server.close(async () => {
        await pool.end();
        console.log("Server dan koneksi database ditutup.");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Server gagal dijalankan karena database tidak tersedia.");
    process.exit(1);
  }
}
app.use(
  cors({
    origin: "https://smart-inclusive-ed-app.vercel.app",
    credentials: true,
  }),
);

app.use(express.json());
startServer();
