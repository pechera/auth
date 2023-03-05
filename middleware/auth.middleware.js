const auth = async (req, res, next) => {
  const acsessToken = req.cookies.authorization;

  if (!acsessToken) {
    return res.render("message", {
      title: "Error",
      message: "You must be autherized",
    });
  }

  next();
};

module.exports = auth;
