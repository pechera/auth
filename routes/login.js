const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

//VALIDATION
const { loginSchema } = require("../functions/validation");

// DATABASE SCHEMAS
const User = require("../models/User");

// LOGIN GET ROUTE
router.get("/login", (req, res) => {
  const acsessToken = req.cookies.authorization;
  if (acsessToken) {
    return res.redirect("/dashboard");
  }
  res.render("login");
});

// FUNTTIONS
const login = require("../functions/login");

// LOGIN POST ROUTE
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Проверяем, что все необходимые поля заполнены
    await loginSchema.validateAsync({ username, password });

    const user = await User.findOne({ username: username });
    if (!user) {
      return res.render("error", { message: "User not found" });
    }
    const compare = await bcrypt.compare(password, user.password);

    if (!compare) {
      return res.render("error", { message: "Incorrect password" });
    }

    const acsessToken = await login(username);
    res.cookie("authorization", acsessToken);

    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
    res.render("error", { message: error.message });
  }
});

module.exports = router;
