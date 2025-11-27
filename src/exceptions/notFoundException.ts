import HttpException from "./httpException";
import { STATUS_CODES } from "../constants/index.constants";

const { NOT_FOUND } = STATUS_CODES;

class NotFoundRequestException extends HttpException {
  constructor(message: string, type = "not_found") {
    super(type, NOT_FOUND, message);
  }
}

export default NotFoundRequestException;
