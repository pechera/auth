const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "virgil.morar@ethereal.email",
    pass: "BB7etH8Kgmm7K7vaUY",
  },
});

module.exports = transporter;
