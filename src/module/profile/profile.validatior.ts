import Joi, { ObjectSchema } from "joi";
import { ICreateProfileReqBody } from "./profile.types";
import * as validationConsts from "../../constants/validations.constans";

class ProfileValidators {
  static validateCreateProfileRequestBody(): ObjectSchema {
    const displayName = Joi.string().empty("").required().messages({
      "any.required": "Invalid display_name. display_name must not be balnk.",
    });

    const passwordField = Joi.string()
      .empty("")
      .pattern(/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]*$/)
      .required()
      .messages({
        "any.required": "Invalid password. password must not be balnk.",
        "string.pattern.base":
          "Invalid password. Passwod must contains a-z, A-Z and 0-9",
      });

    const avatarUrlField = Joi.string().empty("").uri().required().messages({
      "any.required": "Invalid avatar_url. avatar_url must not be balnk.",
      "string.uri": "Invalid avatar_url. Please enter correct url.",
    });

    // body Joi object Schemas
    const profileBody: ObjectSchema<ICreateProfileReqBody> = Joi.object({
      email: validationConsts.VALIDATE_EMAIL,
      display_name: displayName,
      password: passwordField,
      avatar_url: avatarUrlField,
    });

    return profileBody;
  }
}

export default ProfileValidators;
