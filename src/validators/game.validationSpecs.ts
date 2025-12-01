import { ADD_PLAYER, CREATE, END_GAME } from "../constants/endpoint.constants";
import { AccessRole, IValidationSpec } from "./validationSpecs.types";

class GameValidationSpecs {
  public validationSpec: IValidationSpec;

  constructor() {
    this.validationSpec = {
      [CREATE]: {
        body: "validateCreateGame",
        headers: "validateRequestheader",
        access: AccessRole.PRIVATE,
      },
      [ADD_PLAYER]: {
        body: "validateAddplayerRequestBody",
        access: AccessRole.PRIVATE,
      },
      [END_GAME]: {
        access: AccessRole.PRIVATE,
      },
    };
  }
}
export default GameValidationSpecs;
