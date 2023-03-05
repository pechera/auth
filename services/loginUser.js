const jwt = require("jsonwebtoken");

const Token = require("../models/Token.model");

const loginUser = async (username) => {
  try {
    // Создаем Acsess token
    const acsessToken = jwt.sign({ username }, process.env.TOKEN_SECRET, {
      expiresIn: "30m",
    });

    // Создаем Refresh token
    const refreshToken = jwt.sign({ username }, process.env.TOKEN_SECRET, {
      expiresIn: "14d",
    });

    const userToken = await Token.findOne({ username });

    if (userToken) {
      userToken.token = refreshToken;

      await userToken.save();
    } else {
      const newToken = new Token({
        username: username,
        token: refreshToken,
      });

      await newToken.save();
    }

    return acsessToken;
  } catch (error) {
    console.log(error);
    res.render("error", { message: error.message });
  }
};

module.exports = loginUser;
