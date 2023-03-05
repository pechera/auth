const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Token = require("../models/Token");

// LOGOUT ROUTE
router.get("/logout", async (req, res) => {
  const acsessToken = req.cookies.authorization;

  try {
    const { username } = jwt.decode(acsessToken);

    const userToken = await Token.findOneAndDelete({ username: username });

    res.clearCookie("authorization");

    if (!userToken) {
      res.render("error", { message: "User not found" });
    }

    res.redirect("/login");
  } catch (error) {
    console.log(error);
    res.render("error", { message: "Invalid token" });
  }
});

module.exports = router;