import { CREATE } from "../constants/endpoint.constants";
import { IValidationSpec } from "./validationSpecs.types";

class ProfileValidationSpec {
  public validationSpec: IValidationSpec;
  constructor() {
    this.validationSpec = {
      [CREATE]: {
        body: "validateCreateProfileRequestBody",
      },
    };
  }
}
export default ProfileValidationSpec;
