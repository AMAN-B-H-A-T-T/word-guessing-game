import Joi from "joi";
import * as validateConsts from "../constants/validations.constans";
class IndexValidator {
  static validateRequestheader() {
    const accountIdHeader = Joi.string().optional().messages({
      "string.base": "Invalid account-id header.",
      "string.empty": "Invalid account-id header. It must not be blank.",
    });

    const requestHeaderSchema = Joi.object({
      authorization: validateConsts.VALIDTE_ACCESS_TOKEN,
      "account-id": accountIdHeader,
    });

    return requestHeaderSchema;
  }
}

export default IndexValidator;
