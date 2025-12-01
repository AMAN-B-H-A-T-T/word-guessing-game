import { Request, Response } from "express";
import { ICreateGame } from "./game.type";
import logger from "../../configurations/logger.configurations";
import CommonUtilities from "../../utilities/commonUtilities";
import * as consts from "../../constants/index.constants";
import GameUtility from "./game.utilities";

const { CREATED, OK } = consts.STATUS_CODES;
class GameController {
  async createGame(
    request: Request<{}, {}, ICreateGame, {}>,
    response: Response
  ) {
    try {
      const { body, headers } = request;
      const accountId = headers["account-id"];

      const newBoday = await GameUtility.createGame(accountId as string, body);
      CommonUtilities.sendResponse(response, {
        httpCode: CREATED,
        data: newBoday,
      });
    } catch (error) {
      logger.error(`Error at createGame with message : ${error.message}`);
      CommonUtilities.sendErrorResponse(response, error);
    }
  }

  async addPlayerToGame(request: Request, response: Response) {
    try {
      const { body, headers } = request;
      const accountId = headers["account-id"];
      const { game_code: gameCode } = body;

      const newBoday = await GameUtility.addPlayers(
        accountId as string,
        gameCode
      );

      CommonUtilities.sendResponse(response, {
        httpCode: CREATED,
        data: newBoday,
      });
    } catch (error) {
      logger.error(`Error at addPlayerToGame with message : ${error.message}`);
      CommonUtilities.sendErrorResponse(response, error);
    }
  }

  async endGame(request: Request, response: Response) {
    try {
      const { headers, params } = request;
      const gameId = params.id;
      const accountId = headers["account-id"];

      await GameUtility.endGame(gameId, accountId as string);
      const data = {
        message: "Game ended successfully.",
      };

      CommonUtilities.sendResponse(response, {
        httpCode: OK,
        data,
      });
    } catch (error) {
      logger.error(`Error at addPlayerToGame with message : ${error.message}`);
      CommonUtilities.sendErrorResponse(response, error);
    }
  }
}

export default new GameController();
