import { CREATE, LOGIN } from "../constants/endpoint.constants";
import { IValidationSpec } from "./validationSpecs.types";

class ProfileValidationSpec {
  public validationSpec: IValidationSpec;
  constructor() {
    this.validationSpec = {
      [CREATE]: {
        body: "validateCreateProfileRequestBody",
      },
      [LOGIN]: {
        body: "validateLoginRequestBody",
      },
    };
  }
}
export default ProfileValidationSpec;
