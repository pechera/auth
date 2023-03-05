const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  username: { type: String, required: true, min: 5, max: 255 },
  token: { type: String, required: true, min: 5, max: 255 },
});

module.exports = mongoose.model("Token", tokenSchema);
