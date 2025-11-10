import { Prisma } from "@prisma/client";
import redisClient from "../configurations/redis.configurations";
import BadRequestException from "../exceptions/badRequestException";
import { boolean } from "joi";

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
    console.log(data);

    return data;
  }

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
}
export default HelperUtilities;
