const transporter = require("./nodemailer");

async function sendMail(mail, subject, html) {
  const mailOptions = {
    from: "foo",
    to: mail,
    subject: subject,
    text: "",
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(info.response);
  } catch (error) {
    console.log(error);
  }
}

module.exports = sendMail;
