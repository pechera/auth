const express = require("express");
const svgCaptcha = require("svg-captcha");
const bcrypt = require("bcrypt");
const { nanoid } = require("nanoid");

const router = express.Router();

//VALIDATION
const { registerSchema } = require("../functions/validation");

// DATABASE SCHEMAS
const User = require("../models/User");

// REGISTRATION ROUTE
router.get("/registration", (req, res) => {
  const captcha = svgCaptcha.create();
  req.session.captcha = captcha.text;

  res.render("registration", { image: captcha });
});

// FUNTTIONS
const login = require("../functions/login");
const sendMail = require("../functions/mail/sendMail");

// REGISTRATION ROUTE
router.post("/registration", async (req, res) => {
  const { name, username, password, newpassword, email, captcha } = req.body;

  if (password !== newpassword) {
    return res.render("error", { message: "Passwords not match" });
  }

  if (captcha !== req.session.captcha) {
    return res.render("error", { message: "Captcha invalid" });
  }

  try {
    await registerSchema.validateAsync({
      name,
      username,
      password,
      email,
    });

    // Проверяем, что пользователь с таким же username или email не существует
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      return res.render("error", { message: "User already exists" });
    }

    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Email activation link
    const link = nanoid(64);
    const html = `<div><a href="${process.env.URL}/mail/${link}">Activate email</a></div>`;
    sendMail(email, "Email verification", html);

    // Создаем новую запись пользователя в базе данных
    const newUser = new User({
      name,
      username,
      password: hashedPassword,
      email,
      activated: false,
      activation_link: link,
    });

    await newUser.save();

    const acsessToken = await login(username);
    res.cookie("authorization", acsessToken);

    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
    res.render("error", { message: error.message });
  }
});

module.exports = router;
