const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
//const path = require("path");
const cors = require("cors");
const { nanoid } = require("nanoid");
const svgCaptcha = require("svg-captcha");

// DATABASE SCHEMAS
const User = require("./models/User");
const Token = require("./models/Token");
const Templink = require("./models/Templink");

// MIDDLEWARES
const auth = require("./middleware/auth");
const verify = require("./middleware/verify");

//VALIDATION
const {
  registerSchema,
  loginSchema,
  passwordSchema,
} = require("./functions/validation");

// FUNTTIONS
const login = require("./functions/login");
const sendMail = require("./functions/mail/sendMail");

require("dotenv").config({ path: "./env/.env" });
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Connect to MongoDB
(async function () {
  try {
    mongoose.set("strictQuery", false);

    await mongoose.connect(process.env.DB, { useNewUrlParser: true });

    console.log("Сonnected to MongoDB");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.json(), cookieParser(), cors());
app.use(express.static(__dirname + "/public"));

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.get("/", (req, res) => {
  res.redirect("/dashboard");
});

app.get("/login", (req, res) => {
  const acsessToken = req.cookies.authorization;
  if (acsessToken) {
    return res.redirect("/dashboard");
  }
  res.render("login");
});

// LOGIN ROUTE
app.post("/login", async (req, res) => {
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

// DASHBOARD ROUTE
app.get("/dashboard", auth, verify, async (req, res) => {
  const acsessToken = req.cookies.authorization;
  const { username } = jwt.decode(acsessToken);
  res.render("dashboard", { username });
});

// PROFILE ROUTE
app.get("/profile", auth, verify, async (req, res) => {
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

// REGISTRATION ROUTE
app.get("/registration", (req, res) => {
  const captcha = svgCaptcha.create();
  req.session.captcha = captcha.text;

  res.render("registration", { image: captcha });
});

// REGISTRATION ROUTE
app.post("/registration", async (req, res) => {
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

// EMAIL ACTIVATION ROUTE
app.get("/mail/:link", async (req, res) => {
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

// RESET PASSWORD ROUTE
app.get("/reset", async (req, res) => {
  res.render("reset");
});

app.post("/reset", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.activated) {
      return res.render("error", { message: "User not found" });
    }

    const link = nanoid(64);

    const newTemplink = new Templink({
      username: user.username,
      date: Date.now(),
      link: link,
      visited: false,
    });

    await newTemplink.save();

    const html = `<div><a href="${process.env.URL}/reset/${link}">Reset password</a></div>`;
    sendMail(email, "Reset password", html);

    return res.render("error", { message: "Link sent to your email" });
  } catch (error) {
    console.log(error);
    res.render("error", { message: error.message });
  }
});

// RESET PASSWORD ROUTE
app.get("/reset/:link", async (req, res) => {
  const link = req.params.link;

  try {
    const tempLink = await Templink.findOne({ link });
    console.log(tempLink);

    if (!tempLink) {
      return res.render("error", { message: "Link not found" });
    }

    if (tempLink.visited) {
      return res.render("error", { message: "Link is visited" });
    }

    tempLink.visited = true;

    await tempLink.save();

    const now = new Date();
    const createdDate = new Date(tempLink.date);
    const expirationTime = 24 * 60 * 60 * 1000; // 24 часа

    const isValidLink = now - createdDate < expirationTime;

    if (!isValidLink) {
      return res.render("error", { message: "Link expired" });
    }

    req.session.templink = link;
    return res.render("password");
  } catch (error) {
    console.log(error);
    res.render("error", { message: error.message });
  }
});

app.post("/password", async (req, res) => {
  const { password, newpassword } = req.body;
  const link = req.session.templink;

  if (!link) {
    return res.render("error", { message: "Link not found" });
  }

  try {
    await passwordSchema.validateAsync({
      password,
    });

    const tempLink = await Templink.findOne({ link });

    const user = await User.findOne({ username: tempLink.username });

    if (!user) {
      return res.render("error", { message: "User not found" });
    }

    if (password !== newpassword) {
      return res.render("error", { message: "Passwords not match" });
    }

    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;

    await user.save();

    return res.render("error", { message: "Password changes" });
  } catch (error) {
    console.log(error);
    res.render("error", { message: error.message });
  }
});

// LOGOUT ROUTE
app.get("/logout", async (req, res) => {
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

app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
