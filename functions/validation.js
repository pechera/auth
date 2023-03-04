const Joi = require("@hapi/joi");

const registerSchema = Joi.object({
  name: Joi.string().min(3).required(),
  username: Joi.string().min(3).required(),
  password: Joi.string().min(6).required(),
  email: Joi.string().min(6).email().required(),
  //activated: Joi.boolean().required(),
  //activation_link: Joi.string().min(15).required(),
});

const loginSchema = Joi.object({
  username: Joi.string().min(3).required(),
  password: Joi.string().min(3).required(),
});

module.exports = { registerSchema, loginSchema };
