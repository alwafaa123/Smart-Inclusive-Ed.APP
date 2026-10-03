// Memastikan pengguna sudah login.
exports.requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Silakan login terlebih dahulu.",
    });
  }

  next();
};

// Memastikan pengguna memiliki peran yang diizinkan.
exports.requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Silakan login terlebih dahulu.",
      });
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki izin untuk mengakses fitur ini.",
      });
    }

    next();
  };
};
