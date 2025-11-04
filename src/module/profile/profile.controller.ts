import { Request, Response } from "express";
import logger from "../../configurations/logger.configurations";
import * as consts from "../../constants/index.constants";
import CommonUtilities from "../../utilities/commonUtilities";
import ProfileUtilities from "./profile.utilities";
const { OK, CREATED } = consts.STATUS_CODES;
class ProfileController {
  public async createUserProfile(request: Request, response: Response) {
    try {
      const { body } = request;
      const newBody = await ProfileUtilities.createProfile(body);
      return CommonUtilities.sendResponse(response, {
        httpCode: CREATED,
        data: newBody,
      });
    } catch (error) {
      logger.error(`Error at createUserProfile with message: ${error.message}`);
      CommonUtilities.sendErrorResponse(response, error);
    }
  }

  public async loginUser(request: Request, response: Response) {
    try {
      const { body } = request;
      const newBody = await ProfileUtilities.login(body);

      return CommonUtilities.sendResponse(response, {
        httpCode: OK,
        data: newBody,
      });
    } catch (error) {
      logger.error(`Error at loginUser with message: ${error.message}`);
      CommonUtilities.sendErrorResponse(response, error);
    }
  }
}
export default new ProfileController();
