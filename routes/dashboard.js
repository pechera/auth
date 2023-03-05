const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

// MIDDLEWARES
const auth = require("../middleware/auth.middleware");
const verify = require("../middleware/verify.middleware");

// DASHBOARD ROUTE
router.get("/dashboard", auth, verify, async (req, res) => {
  const acsessToken = req.cookies.authorization;
  const { username } = jwt.decode(acsessToken);
  res.render("dashboard", { username });
});

module.exports = router;
