const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const { pool } = require("./database");

const sessionStore = new MySQLStore(
  {
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: Number(process.env.SESSION_MAX_AGE) || 86400000,
    createDatabaseTable: true,
    schema: {
      tableName: "sessions",
    },
  },
  pool,
);

const sessionMiddleware = session({
  name: process.env.SESSION_NAME || "smartinclusive.sid",
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: Number(process.env.SESSION_MAX_AGE) || 86400000,
  },
});

module.exports = sessionMiddleware;
