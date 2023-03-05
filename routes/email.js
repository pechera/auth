const express = require("express");

const router = express.Router();

// DATABASE SCHEMAS
const User = require("../models/User.model");

// EMAIL ACTIVATION ROUTE
router.get("/mail/:link", async (req, res) => {
  const link = req.params.link;
  try {
    const user = await User.findOne({ activation_link: link });

    if (!user) {
      return res.send("Wrong activation link");
    }

    if (user.activated) {
      return res.send("Email already activated");
    }

    if (link === user.activation_link) {
      user.activated = true;
      await user.save();

      return res.send("Email activated");
    }
  } catch (error) {
    console.log(error);
    res.render("error", { message: error.message });
  }
});

module.exports = router;
