const jwt = require("jsonwebtoken");

// DATABASE SCHEMAS
const Token = require("../models/Token.model");

const verify = async (req, res, next) => {
  const acsessToken = req.cookies.authorization;

  try {
    const decode = jwt.decode(acsessToken);
    const username = decode.username;
    const acsessExp = decode.exp;

    const isAcsessExpired = Date.now() >= acsessExp * 1000;

    if (isAcsessExpired) {
      console.log("expired");

      const refreshUser = await Token.findOne({ username: username });

      const refreshDecode = jwt.decode(refreshUser.token);

      const refreshExp = refreshDecode.exp;

      const isRefreshExpired = Date.now() >= refreshExp * 1000;

      if (isRefreshExpired) {
        res.clearCookie("authorization");
        return res.render("message", {
          title: "Error",
          message: "Refresh token is expired",
        });
      }

      const acsessToken = jwt.sign({ username }, process.env.TOKEN_SECRET, {
        expiresIn: "30m",
      });

      res.cookie("authorization", acsessToken);
      return next();
    }

    return next();
  } catch (error) {
    console.log(error);
    return res.render("message", { title: "Error", message: error.message });
  }
};

module.exports = verify;
