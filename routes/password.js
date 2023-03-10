const express = require("express");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");

const router = express.Router();

//VALIDATION
const { passwordSchema } = require("../models/Joi.validation.model");

// DATABASE SCHEMAS
const User = require("../models/User.model");
const Templink = require("../models/Templink.model");

// FUNTTIONS
const sendMail = require("../services/sendMail");

// RESET PASSWORD ROUTE
router.get("/reset", async (req, res) => {
  res.render("reset");
});

router.post("/reset", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.activated) {
      return res.render("message", {
        title: "Error",
        message: "User not found",
      });
    }

    const link = nanoid(64);

    const userTemplink = await Templink.findOne({ username: user.username });

    if (userTemplink) {
      userTemplink.date = Date.now();
      userTemplink.link = link;
      userTemplink.visited = false;

      await userTemplink.save();
    } else {
      const newTemplink = new Templink({
        username: user.username,
        date: Date.now(),
        link: link,
        visited: false,
      });

      await newTemplink.save();
    }

    const html = `<div><a href="${process.env.URL}/reset/${link}">Reset password</a></div>`;
    sendMail(email, "Reset password", html);

    return res.render("message", {
      title: "Message",
      message: "Link sent to your email",
    });
  } catch (error) {
    console.log(error);
    res.render("message", {
      title: "Error",
      message: error.message,
    });
  }
});

// RESET PASSWORD ROUTE
router.get("/reset/:link", async (req, res) => {
  const link = req.params.link;

  try {
    const tempLink = await Templink.findOne({ link });

    if (!tempLink) {
      return res.render("message", {
        title: "Error",
        message: "Link not found",
      });
    }

    if (tempLink.visited) {
      return res.render("message", {
        title: "Error",
        message: "Link is visited",
      });
    }

    tempLink.visited = true;

    await tempLink.save();

    const now = new Date();
    const createdDate = new Date(tempLink.date);
    const expirationTime = 24 * 60 * 60 * 1000; // 24 ????????

    const isValidLink = now - createdDate < expirationTime;

    if (!isValidLink) {
      return res.render("message", { title: "Error", message: "Link expired" });
    }

    req.session.templink = link;
    return res.render("password");
  } catch (error) {
    console.log(error);
    res.render("message", {
      title: "Error",
      message: error.message,
    });
  }
});

router.post("/password", async (req, res) => {
  const { password, newpassword } = req.body;
  const link = req.session.templink;

  if (!link) {
    return res.render("message", {
      title: "Error",
      message: "Link not found",
    });
  }

  try {
    await passwordSchema.validateAsync({
      password,
    });

    const tempLink = await Templink.findOne({ link });

    const user = await User.findOne({ username: tempLink.username });

    if (!user) {
      return res.render("message", {
        title: "Error",
        message: "User not found",
      });
    }

    if (password !== newpassword) {
      return res.render("message", {
        title: "Error",
        message: "Passwords not match",
      });
    }

    // ???????????????? ????????????
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;

    await user.save();

    return res.render("message", {
      title: "Message",
      message: "Password changes",
    });
  } catch (error) {
    console.log(error);
    res.render("message", { title: "Error", message: error.message });
  }
});

module.exports = router;
