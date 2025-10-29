import { Request, Response } from "express";
import logger from "../../configurations/logger.configurations";
import * as consts from "../../constants/index.constants";
import CommonUtilities from "../../utilities/commonUtilities";
const { OK } = consts.STATUS_CODES;
class ProfileController {
  public async createUserProfile(request: Request, response: Response) {
    try {
      CommonUtilities.sendResponse(response, {
        httpCode: OK,
        data: "test api response",
      });
    } catch (error) {
      logger.error(`Error at createUserProfile with message: ${error.message}`);
    }
  }
}
export default new ProfileController();
