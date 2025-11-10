import { Prisma, Games, GameDifficultyType, GameStatus } from "@prisma/client";
import CommonUtilities from "../../utilities/commonUtilities";
import { ICreateGame, playerWithUserDetails } from "./game.type";
import logger from "../../configurations/logger.configurations";
import BadRequestException from "../../exceptions/badRequestException";
import gameServices from "./game.services";
import redisClient from "../../configurations/redis.configurations";
import { API_MODE } from "../../constants/index.constants";
import HelperUtilities from "../../utilities/helperUtilities";
import drawableWords from "../../database/models/drawableWords";

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

    const player = await this.addPlayers(
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

    await redisClient.hSet(
      `game:${createdGame.gameCode}:${createdGame.id}:round`,
      {
        round: 0,
        turn: "",
      }
    );

    await redisClient.set(
      `game:${createdGame.gameCode}:${createdGame.id}:roomCreator`,
      player.id
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
      // check max playres reached
      const gameData = await this.getGameDetails(gameCode, gameId);
      const { max_players: maxPlayers, players } = gameData;
      console.log(gameData);
      console.log(gameData.status);
      if (gameData.status !== GameStatus.INIT) {
        throw new BadRequestException(
          "A game is started. Now you can not join."
        );
      }

      if (players.length + 1 > maxPlayers) {
        throw new BadRequestException(
          "The game room is full. Maximum number of players has been reached."
        );
      }

      const isAlreadyAdded = players.some(
        (player: any) => player.user_id === accountId
      );

      if (isAlreadyAdded) {
        throw new BadRequestException(
          "Invalid join request. Player has already joined this game."
        );
      }
    }

    // create game-player mapping
    const currentTime = Date.now();
    const mappingPayload: Prisma.PlayersUncheckedCreateInput = {
      id: CommonUtilities.generateRandomID("ply"),
      gameId: gameId,
      userId: accountId,
      isGameCreator: Number(mode === API_MODE.INTERNAL),
      created: currentTime,
      modified: currentTime,
    };

    const createdPlayer = (await gameServices.createPlayer(
      mappingPayload
    )) as playerWithUserDetails;
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

    // add player score details
    await redisClient.hSet(
      `game:${gameCode}:${gameId}:round`,
      createdPlayer.id,
      0
    );

    return playerDetails;
  }

  static async updateGameState(
    state: GameStatus,
    gameId: string,
    gameCode: string
  ) {
    const updateDate: Prisma.GamesUpdateInput = {
      status: state,
    };

    await gameServices.updateGame(gameId, updateDate);

    // update game state in redis
    await redisClient.hSet(`game:${gameCode}:${gameId}:gameDetails`, {
      status: state,
      modified: Date.now(),
    });
  }

  static async getGameDetails(
    gameCode: string,
    gameId: string
  ): Promise<Record<string, any>> {
    let gameData = await redisClient.hGetAll(
      `game:${gameCode}:${gameId}:gameDetails`
    );

    if (!gameData) {
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
    }

    const players = (await redisClient.sMembers(
      `game:${gameCode}:${gameId}:players`
    )) as string[];
    const pipeline = redisClient.multi();

    let playerDetails: Array<Record<string, any>> = [];

    if (players || players.length) {
      for (const playerId of players) {
        pipeline.hGetAll(`game:${gameCode}:${playerId}:playerDetails`);
      }
      const result = await pipeline.exec();

      playerDetails = result.map((data: any) => {
        return data;
      });
    } else {
      const playerWhereObject: Prisma.PlayersWhereInput = {
        gameId,
      };

      const players = (await gameServices.fetchPlayers({
        whereObject: playerWhereObject,
        includeObject: {
          user: true,
        },
      })) as playerWithUserDetails[];

      playerDetails = players.map((player) => this.buildPlayerResponse(player));
    }

    return {
      ...gameData,
      players: playerDetails,
    };
  }

  static async handelTurns(gameCode: string, gameId: string) {
    const key = `game:${gameCode}:${gameId}:turns`;
    const roundKey = `game:${gameCode}:${gameId}:round`;

    const currentPlayerTurn = await redisClient.lIndex(key, 0);
    console.log("current player", currentPlayerTurn);
    const roomCreator = await redisClient.get(
      `game:${gameCode}:${gameId}:roomCreator`
    );
    console.log("room creator", roomCreator);
    if (currentPlayerTurn === roomCreator) {
      await redisClient.hIncrBy(roundKey, "round", 1);
    }

    // update player turn
    await redisClient.hSet(roundKey, "turn", currentPlayerTurn);

    // update queue
    await redisClient.rPopLPush(key, key);

    const response = await HelperUtilities.buildRoundData(gameCode, gameId);
    return response;
  }

  static async updateGameSettings(gameId: string, data: Record<string, any>) {
    await gameServices.updateGame(gameId, data);
    return;
  }

  static async getDrawableWordsOptions(settings: Record<string, any>) {
    const query: Array<any> = [
      {
        length: { $gte: settings.min_word_lenght },
      },
      {
        $sample: { size: settings.word_count },
      },
      {
        $project: {
          _id: 0,
          word: 1,
        },
      },
      {
        $sort: {
          word: 1,
        },
      },
    ];

    const words = await drawableWords.aggregate(query);
    return this.buildWordsList(words);
  }

  static buildGameResponse(game: Games) {
    return {
      id: game.id,
      status: game.status,
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

  static buildPlayerResponse(player: playerWithUserDetails) {
    return {
      id: player.id,
      score: player.score,
      user_id: player.userId,
      is_game_creator: player.isGameCreator,
      display_name: player.user.displayName,
      avatar_url: player.user.avatarUrl,
    };
  }

  static buildWordsList(words: Array<any>) {
    return words.map((word) => word.word);
  }
}
export default GameUtility;
