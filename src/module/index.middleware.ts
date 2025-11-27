import { NextFunction, Request, Response } from "express";
import rtracer from "cls-rtracer";
import { HEADER_CONSTS } from "../constants/index.constants";
import logger, {
  initializeTracer,
} from "../configurations/logger.configurations";
import CommonUtilities from "../utilities/commonUtilities";

const { SPEED_REQUEST_HEADER } = HEADER_CONSTS;
class IndexMiddleware {
  /*
   *  sets the speed-request header to HTTP request's ID
   */
  setRequestId(
    request: Request<{}, {}, {}>,
    _response: Response,
    next: NextFunction
  ): void {
    let speedRequest: string = request.headers[SPEED_REQUEST_HEADER] as string;
    const method = request.method;
    const baseUrl = request.path;

    if (CommonUtilities.isEmpty(speedRequest)) {
      speedRequest = rtracer.id() as string;
      request.headers[SPEED_REQUEST_HEADER] = speedRequest;
    } else {
      initializeTracer(request.headers[SPEED_REQUEST_HEADER] as string);
    }

    _response.header(
      SPEED_REQUEST_HEADER,
      request.headers[SPEED_REQUEST_HEADER]
    );

    logger.info(`[${method}] : ${baseUrl}`);
    next();
  }

  /*
   *  sets the current UNIX timestamp on the request object
   */
  setRequestTime(
    request: Request<{}, {}, {}>,
    _response: Response,
    next: NextFunction
  ): void {
    (request as any).time = new Date().getTime();

    next();
  }
}

export default new IndexMiddleware();
