const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Token = require("../models/Token.model");

// LOGOUT ROUTE
router.get("/logout", async (req, res) => {
  const acsessToken = req.cookies.authorization;

  try {
    const { username } = jwt.decode(acsessToken);

    const userToken = await Token.findOneAndDelete({ username: username });

    res.clearCookie("authorization");

    if (!userToken) {
      return res.render("message", {
        title: "Error",
        message: "User not found",
      });
    }

    res.redirect("/login");
  } catch (error) {
    console.log(error);
    res.render("message", {
      title: "Error",
      message: "Invalid token",
    });
  }
});

module.exports = router;
