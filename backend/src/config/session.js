const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const { pool } = require("./database");

const sessionMaxAge = Number(process.env.SESSION_MAX_AGE) || 7 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;
if (
  !sessionSecret ||
  sessionSecret.length < 32 ||
  sessionSecret.startsWith("ganti_dengan")
) {
  throw new Error(
    "SESSION_SECRET must be set to a random value of at least 32 characters.",
  );
}

const sessionStore = new MySQLStore(
  {
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: sessionMaxAge,
    createDatabaseTable: true,
    schema: {
      tableName: "sessions",
    },
  },
  pool,
);

const sessionMiddleware = session({
  name: process.env.SESSION_NAME || "smartinclusive.sid",
  secret: sessionSecret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: sessionMaxAge,
  },
});

module.exports = sessionMiddleware;
