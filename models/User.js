const mongoose = require("mongoose");
const { customAlphabet } = require("nanoid");

const nanoid = customAlphabet("1234567890", 10);

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    default: () => nanoid(7),
    index: { unique: true },
  },
  name: { type: String, required: true, min: 5, max: 255 },
  username: { type: String, required: true, min: 5, max: 255 },
  password: { type: String, required: true, min: 5, max: 255 },
  email: { type: String, required: true, min: 5, max: 255 },
  activated: { type: Boolean, required: true, default: false },
  activation_link: { type: String, required: true, min: 64 },
});

module.exports = mongoose.model("User", userSchema);
