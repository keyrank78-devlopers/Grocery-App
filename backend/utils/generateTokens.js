const jwt = require("jsonwebtoken");

const generateTokens = (id, role) => {
  const accessToken = jwt.sign({ id, role }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  });

  const refreshToken = jwt.sign(
    { id, role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" },
  );

  return { accessToken, refreshToken };
};

module.exports = generateTokens;
