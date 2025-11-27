import HttpException from "./httpException";
import { STATUS_CODES } from "../constants/index.constants";

const { UNAUTORIZED } = STATUS_CODES;

class UnAuthorizedException extends HttpException {
  constructor(message: string, type = "invalid_token_scope") {
    super(type, UNAUTORIZED, message);
  }
}

export default UnAuthorizedException;
