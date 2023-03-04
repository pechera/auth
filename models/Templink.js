const mongoose = require("mongoose");

const templinkSchema = new mongoose.Schema({
  username: { type: String, required: true, min: 5, max: 255 },
  date: { type: Date, default: Date.now },
  link: { type: String, required: true, min: 5, max: 255 },
  visited: { type: Boolean, required: true, default: false },
});

module.exports = mongoose.model("templinkSchema", templinkSchema);
