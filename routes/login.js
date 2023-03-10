const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

//VALIDATION
const { loginSchema } = require("../models/Joi.validation.model");

// DATABASE SCHEMAS
const User = require("../models/User.model");

// LOGIN GET ROUTE
router.get("/login", (req, res) => {
  const acsessToken = req.cookies.authorization;
  if (acsessToken) {
    return res.redirect("/dashboard");
  }
  res.render("login");
});

// FUNCTIONS
const login = require("../services/loginUser");

// LOGIN POST ROUTE
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Проверяем, что все необходимые поля заполнены
    await loginSchema.validateAsync({ username, password });

    const user = await User.findOne({ username: username });
    if (!user) {
      return res.render("message", {
        title: "Error",
        message: "User not found",
      });
    }
    const compare = await bcrypt.compare(password, user.password);

    if (!compare) {
      return res.render("message", {
        title: "Error",
        message: "Incorrect password",
      });
    }

    const acsessToken = await login(username);
    res.cookie("authorization", acsessToken);

    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
    res.render("message", { title: "Error", message: "User not found" });
  }
});

module.exports = router;
