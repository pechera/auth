const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const app = express();

require("dotenv").config({ path: "./env/.env" });
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; // Временное решения для Nodemailer

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

app.set("view engine", "ejs");
app.use(bodyParser.json(), cookieParser(), cors());
app.use(express.static(path.join(__dirname, "/public")));

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

// ROUTES
app.use("/", require("./routes/dashboard"));
app.use("/", require("./routes/logout"));
app.use("/", require("./routes/login"));
app.use("/", require("./routes/registration"));
app.use("/", require("./routes/profile"));
app.use("/", require("./routes/password"));
app.use("/", require("./routes/email"));

app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
