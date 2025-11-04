import Joi from "joi";

export const VALIDATE_EMAIL = Joi.string()
  .empty("") // treat empty string as invalid
  .email()
  .required()
  .messages({
    "any.required": "Invalid email. Email must not be blank.",
    "string.email": "Invalid email. Please enter a valid email.",
    "string.empty": "Email cannot be empty.",
  });

export const VALIDTE_ACCESS_TOKEN = Joi.string()
  .empty("")
  .pattern(/^Bearer\s.+/)
  .required()
  .messages({
    "any.required": "Authorization header is missig.",
    "string.empty": "Invalid Authorization header. It must not be blank.",
    "string.pattern.base": "Invaid Authorization header.",
  });
