import HttpException from "./httpException";
import { STATUS_CODES } from "../constants/index.constants";

const { BAD_REQUEST } = STATUS_CODES;

class BadRequestException extends HttpException {
  constructor(message: string, type = "invalid_request_error") {
    super(type, BAD_REQUEST, message);
  }
}

export default BadRequestException;
