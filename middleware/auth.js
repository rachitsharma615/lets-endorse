const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { userId: decoded.userId, encryptionKey: "81aba971957872504aa945c02a7912516324a497ccec3a32298e7358fb00b7fc"};

    next();
  } catch (error) {
    // Return a 401 Unauthorized response if the token is invalid
    res.status(401).json({ message: "Invalid token" });
  }
};
