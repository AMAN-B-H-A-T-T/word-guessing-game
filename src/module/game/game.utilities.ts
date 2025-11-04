import {
  Prisma,
  Games,
  GameDifficultyType,
  Players,
  GameStatus,
} from "@prisma/client";
import CommonUtilities from "../../utilities/commonUtilities";
import { ICreateGame } from "./game.type";
import logger from "../../configurations/logger.configurations";
import BadRequestException from "../../exceptions/badRequestException";
import gameServices from "./game.services";
import redisClient from "../../configurations/redis.configurations";
import { API_MODE } from "../../constants/index.constants";

class GameUtility {
  static async createGame(
    accountId: string,
    gameData: ICreateGame,
    retries = 1
  ) {
    // generate game_code (room-id)
    const gameCode = await CommonUtilities.generateRoomId();

    const currentTime = Date.now();
    // create game payload
    const gamepayLoad: Prisma.GamesCreateInput = {
      id: CommonUtilities.generateRandomID("gme"),
      rounds: gameData.rounds,
      gameCode,
      drawTime: gameData.draw_time,
      maxPlayers: gameData.max_players,
      minWordLength: gameData.min_word_length,
      wordCount: gameData.word_count,
      difficulty: gameData.difficulty_level as GameDifficultyType,
      created: currentTime,
      modified: currentTime,
    };

    let createdGame: Games = null;
    try {
      createdGame = await gameServices.createGame(gamepayLoad);
    } catch (error) {
      if (error?.code === "P2002") {
        if (retries > 3) {
          throw new BadRequestException(
            "We couldn’t create your game right now. Please try again in a moment."
          );
        }
        logger.warn(`unique constraint is faild for game_code : ${gameCode}`);
        this.createGame(accountId, gameData, retries + 1);
      }
      throw new BadRequestException(error.message);
    }

    await this.addPlayers(
      accountId,
      createdGame.id,
      createdGame.gameCode,
      API_MODE.INTERNAL
    );
    const res = this.buildGameResponse(createdGame);

    // add game to redis
    await redisClient.hSet(
      `game:${createdGame.gameCode}:${createdGame.id}:gameDetails`,
      res
    );

    return res;
  }

  static async addPlayers(
    accountId: string,
    gameId: string,
    gameCode: string,
    mode = API_MODE.EXTERNAL
  ) {
    if (mode === API_MODE.EXTERNAL) {
      const gameWhereObject: Prisma.GamesWhereInput = {
        id: gameId,
        gameCode,
        status: GameStatus.INIT,
      };
      const gameSelectObject: Prisma.GamesSelect = {
        maxPlayers: true,
      };

      const gameData = await gameServices.fetchGameData({
        whereObject: gameWhereObject,
        selectObject: gameSelectObject,
      });

      if (!gameData) {
        throw new BadRequestException("Invaid game. A game is not found.");
      }

      // check max playres reached
      const playerWhereObject: Prisma.PlayersWhereInput = {
        gameId,
        status: 1,
      };

      const playerSelectObject: Prisma.PlayersSelect = {
        userId: true,
      };

      const players = await gameServices.fetchPlayers({
        whereObject: playerWhereObject,
        selectObject: playerSelectObject,
      });

      if (players.length + 1 > gameData.maxPlayers) {
        throw new BadRequestException(
          "The game room is full. Maximum number of players has been reached."
        );
      }

      const isAlreadyAdded = players.some(
        (player) => player.userId === accountId
      );

      if (isAlreadyAdded) {
        throw new BadRequestException(
          "Invalid join request. Player has already joined this game."
        );
      }
    }
    // create game-player mapping
    const currentTime = Date.now();
    const mappingPayload: Prisma.PlayersCreateInput = {
      id: CommonUtilities.generateRandomID("ply"),
      gameId: gameId,
      userId: accountId,
      isGameCreator: 1,
      created: currentTime,
      modified: currentTime,
    };

    const createdPlayer = await gameServices.createPlayer(mappingPayload);
    const playerDetails = this.buildPlayerResponse(createdPlayer);

    // add player to set
    await redisClient.sAdd(
      `game:${gameCode}:${gameId}:players`,
      createdPlayer.id
    );

    // add playres details
    await redisClient.hSet(
      `game:${gameCode}:${createdPlayer.id}:playerDetails`,
      playerDetails
    );

    // push playres to turns list
    await redisClient.rPush(
      `game:${gameCode}:${gameId}:turns`,
      createdPlayer.id
    );
    return playerDetails;
  }

  static buildGameResponse(game: Games) {
    return {
      id: game.id,
      stauts: game.status,
      rounds: game.rounds,
      difficulty_level: game.difficulty,
      max_players: game.maxPlayers,
      min_word_lenght: game.minWordLength,
      word_count: game.wordCount,
      game_code: game.gameCode,
      draw_time: game.drawTime,
      created: Number(game.created),
      modified: Number(game.modified),
    };
  }

  static buildPlayerResponse(player: Players) {
    return {
      id: player.id,
      score: player.score,
      user_id: player.userId,
      is_game_creator: player.isGameCreator,
    };
  }
}
export default GameUtility;
