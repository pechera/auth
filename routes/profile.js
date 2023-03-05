const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

// DATABASE SCHEMAS
const User = require("../models/User.model");

// MIDDLEWARES
const auth = require("../middleware/auth.middleware");
const verify = require("../middleware/verify.middleware");

// PROFILE ROUTE
router.get("/profile", auth, verify, async (req, res) => {
  const acsessToken = req.cookies.authorization;

  try {
    const { username } = jwt.decode(acsessToken);

    const user = await User.findOne({ username });

    res.render("profile", { user });
  } catch (error) {
    console.log(error);
    res.render("error", { message: error.message });
  }
});

module.exports = router;
