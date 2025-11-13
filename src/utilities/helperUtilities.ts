import { GameStatus, Prisma } from "@prisma/client";
import redisClient from "../configurations/redis.configurations";
import BadRequestException from "../exceptions/badRequestException";
import CommonUtilities from "./commonUtilities";
import GameUtility from "../module/game/game.utilities";
import { deleteGameTemporaryData } from "./redisCleanup";
import { playerStausType } from "../module/index.types";

class HelperUtilities {
  static async checkPlayerAlreadyInRoom(roomId: string, playerId: string) {
    const exist = await redisClient.sIsMember(
      `room:${roomId}:members`,
      playerId
    );

    if (exist) {
      throw new BadRequestException("Player has already joined.");
    }

    const playerFound = await redisClient.sIsMember(
      `game:${roomId}:players`,
      playerId
    );

    if (!playerFound) {
      throw new BadRequestException("Player details not found.");
    }
  }

  static buildGameData(gameData: Record<string, any>) {
    const data: Record<string, any> = {
      game_code: gameData.game_code,
      status: gameData.status,
      setting: [
        gameData.rounds, //rounds
        gameData.difficulty_level, // difficulty_level
        gameData.max_players, // max_players
        gameData.min_word_lenght, // min_word_lenght
        gameData.word_count, // word_count
        gameData.draw_time, // draw_time
      ],
    };

    const players = gameData.players.map((player: any) => {
      return [
        player.display_name,
        player.avatar_url,
        player.score,
        player.is_game_creator,
      ];
    });
    data["players"] = players;

    return data;
  }

  static async buildRoundData(gameCode: string, gameId: string) {
    const data: Record<string, any> = await redisClient.hGetAll(
      `game:${gameCode}:${gameId}:round`
    );

    return data;
  }
  // [round,difficulty,maxPlayers,minWordLength,wordCount,drawTime]
  static async prepareSesttingData(data: Array<any>) {
    const settingsPayload: Prisma.GamesUpdateInput = {
      rounds: data[0],
      difficulty: data[1],
      maxPlayers: data[2],
      minWordLength: data[3],
      wordCount: data[4],
      drawTime: data[5],
    };

    return settingsPayload;
  }

  // [word,difficulty,time,attempts]
  static async processguess(
    gameCode: string,
    gameId: string,
    playerId: string,
    metadata: Array<any>
  ) {
    const word = metadata[0];
    const difficulty = metadata[1];
    const time = metadata[2];
    const attempts = metadata[3];
    const trimmedWord = word.trim();
    const key = `game:${gameCode}:${gameId}:selectedWord`;
    const selectedWord = await redisClient.get(key);
    const roundKey = `game:${gameCode}:${gameId}:round`;

    if (trimmedWord !== selectedWord) {
      const penalty = CommonUtilities.calculateScore(
        false,
        100,
        time,
        difficulty,
        attempts
      );
      await redisClient.hIncrBy(roundKey, playerId, penalty);
      return 0;
    }
    const score = CommonUtilities.calculateScore(
      true,
      100,
      time,
      difficulty,
      attempts
    );

    // increase player score who drawing object
    const playreTurn = await redisClient.hGet(roundKey, "turn");
    const drawingScore = CommonUtilities.calculateScore(
      true,
      47,
      time,
      difficulty,
      attempts
    );
    await redisClient.hIncrBy(roundKey, playreTurn, drawingScore);
    // increment  player score
    await redisClient.hIncrBy(roundKey, playerId, score);

    return score;
  }

  static async handlePlayerDisconnection(
    gameCode: string,
    gameId: string,
    playerId: string
  ) {
    const memberKey = `room:${gameCode}:${gameId}:members`;
    const turnsKey = `game:${gameCode}:${gameId}:turns`;
    const playerDetailsKey = `game:${gameCode}:${playerId}:playerDetails`;

    //find all playres online in room
    const members = (await redisClient.sMembers(memberKey)) as string[];
    if (!members.length) {
      return 0;
    }
    const isPlayerExist = members.some((memberId) => memberId === playerId);

    if (!isPlayerExist) {
      throw new BadRequestException("Playres details are not found.");
    }

    if (members.length - 1 === 1) {
      // mark the game as the ongoing to ended
      await GameUtility.updateGameState(GameStatus.ENDED, gameId, gameCode);
      const pattern = `*:${gameCode}:${gameId}:*`;
      await deleteGameTemporaryData(pattern);

      return -1;
    }

    // remove player from members set
    await redisClient.sRem(memberKey, playerId);

    // remove playre from turns list
    await redisClient.lRem(turnsKey, 1, playerId);

    // update player status
    await redisClient.del(playerDetailsKey);

    //update player status in DB
    await GameUtility.updatePlayerStatus(playerStausType.offline, playerId);

    return 1;
  }

  static async protectedEvents(
    gameCode: string,
    gameId: string,
    playerId: string
  ) {
    const roundKey = `game:${gameCode}:${gameId}:round`;
    const turnPlayer = (await redisClient.hGet(roundKey, "turn")) as string;
    if (turnPlayer !== playerId) {
      throw new BadRequestException(
        "This event can only be sent by the player whose turn is currently active."
      );
    }
  }
}
export default HelperUtilities;
