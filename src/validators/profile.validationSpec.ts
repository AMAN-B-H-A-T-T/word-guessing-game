import { CREATE, LOGIN } from "../constants/endpoint.constants";
import { AccessRole, IValidationSpec } from "./validationSpecs.types";

class ProfileValidationSpec {
  public validationSpec: IValidationSpec;
  constructor() {
    this.validationSpec = {
      [CREATE]: {
        body: "validateCreateProfileRequestBody",
        access: AccessRole.PUBLIC,
      },
      [LOGIN]: {
        body: "validateLoginRequestBody",
        access: AccessRole.PUBLIC,
      },
    };
  }
}
export default ProfileValidationSpec;
