import { Prisma, PrismaPromise, Games, Players } from "@prisma/client";
import database from "../../database";
import { IFetchQueryProps } from "../index.types";

class GameService {
  createGame(data: Prisma.GamesCreateInput): PrismaPromise<Games> {
    const { games: gameModel } = database["prismaDrawPandasDB"];
    const query: Prisma.GamesCreateArgs = {
      data,
      select: {
        id: true,
        created: true,
        modified: true,
        rounds: true,
        drawTime: true,
        difficulty: true,
        gameCode: true,
        maxPlayers: true,
        minWordLength: true,
        status: true,
        wordCount: true,
      },
    };

    return gameModel.create(query);
  }

  createPlayer(data: Prisma.PlayersUncheckedCreateInput) {
    const { players: playersModel } = database["prismaDrawPandasDB"];
    const query: Prisma.PlayersCreateArgs = {
      data,
      include: {
        user: true,
      },
    };

    return playersModel.create(query);
  }

  fetchGameData({
    whereObject,
    selectObject,
    includeObject,
  }: IFetchQueryProps) {
    const { games: gameModule } = database["prismaDrawPandasDB"];
    const query: Prisma.GamesFindFirstArgs = {};
    if (whereObject) {
      query.where = whereObject;
    }

    if (selectObject) {
      query.select = selectObject;
    }

    if (includeObject) {
      query.select = includeObject;
    }

    return gameModule.findFirst(query);
  }

  countActivePlayers({ whereObject, selectObject }: IFetchQueryProps) {
    const { players: playerModule } = database["prismaDrawPandasDB"];
    const query: Prisma.PlayersCountArgs = {};
    if (whereObject) {
      query.where = whereObject;
    }

    if (selectObject) {
      query.select = selectObject;
    }

    return playerModule.count(query);
  }

  fetchPlayers({
    whereObject,
    selectObject,
  }: IFetchQueryProps): PrismaPromise<Players[]> {
    const { players: playerModel } = database["prismaDrawPandasDB"];
    const query: Prisma.PlayersFindManyArgs = {};
    if (whereObject) {
      query.where = whereObject;
    }

    if (selectObject) {
      query.select = selectObject;
    }

    return playerModel.findMany(query);
  }

  updateGame(gameId: string, data: Prisma.GamesUpdateInput) {
    const { games: gameModel } = database["prismaDrawPandasDB"];

    const currentTime = Date.now();
    data.modified = currentTime;

    const query: Prisma.GamesUpdateArgs = {
      where: { id: gameId },
      data,
    };

    return gameModel.update(query);
  }

  updatePlayer(playerId: string, data: Prisma.PlayersUpdateInput) {
    const { players: playerModel } = database["prismaDrawPandasDB"];
    const query: Prisma.PlayersUpdateArgs = {
      where: {
        id: playerId,
      },
      data,
    };

    return playerModel.update(query);
  }
}
export default new GameService();
