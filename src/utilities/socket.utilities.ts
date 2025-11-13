import { Socket, Server } from "socket.io";
import { GameStatus } from "@prisma/client";
import logger from "../configurations/logger.configurations";
import GameUtility from "../module/game/game.utilities";
import HelperUtilities from "./helperUtilities";
import redisClient from "../configurations/redis.configurations";
import { DIFFICULTY_LEVEL_MAPPING } from "../constants/index.constants";
import BadRequestException from "../exceptions/badRequestException";

class SocketUtilities {
  public io: Server;
  public socketIdtoRoomIdMap: Record<string, string>;
  constructor(io: Server) {
    this.io = io;
    this.socketIdtoRoomIdMap = {};
    this.setUpSocket();
  }

  private setUpSocket() {
    this.io.on("connect", (socket: Socket) => {
      /**
       * @event : join
       * @param : [roomId,playerId] = message
       * @description : players can emit `join` event for joinning game
       * @returns : data broadcasted : event : `game_data`
       */

      socket.on("join", async (message) => {
        const [roomId, playerId] = message;
        const { gameCode, gameId } = this.getGameCodeAndId(roomId);
        try {
          // check is player is already join to room
          await HelperUtilities.checkPlayerAlreadyInRoom(roomId, playerId);

          // add player to join
          await redisClient.sAdd(`room:${roomId}:members`, playerId);
          this.socketIdtoRoomIdMap[socket.id] = `${roomId}:${playerId}`;

          // push playres to turns list
          await redisClient.rPush(`game:${gameCode}:${gameId}:turns`, playerId);

          // get the game data
          const gameData = await GameUtility.getGameDetails(gameCode, gameId);

          // join player to room
          socket.join(roomId);

          const data = HelperUtilities.buildGameData(gameData);

          this.boradcastMessage("game_data", roomId, data);
        } catch (error) {
          logger.error(`Error at join event : ${error.message}`);
          this.sendErrorMessage(socket, {
            status: 500,
            message: error.message,
          });
        }
      });

      /**
       * @event : "start_date"
       * @param : roomId
       * @description : room creator can triiger this event to change game state from INIT -> ONGOING
       * @returns : data broadcasted : event : 'round'
       */
      socket.on("start_game", async (roomId) => {
        const { gameCode, gameId } = this.getGameCodeAndId(roomId);
        try {
          const membersKey = `room:${roomId}:members`;
          const totalMembersInRoom = (await redisClient.sCard(
            membersKey
          )) as number;

          if (totalMembersInRoom < 2) {
            throw new BadRequestException(
              "Atleast two players are requried to start game."
            );
          }

          await GameUtility.updateGameState(
            GameStatus.ONGOING,
            gameId,
            gameCode
          );

          // boradcast round data with turn and score to players
          const roundDetails = await GameUtility.handelTurns(gameCode, gameId);
          this.boradcastMessage("round_data", roomId, roundDetails);
        } catch (error) {
          logger.error(
            `Error in start_game Event with message : ${error.message}`
          );
          this.sendErrorMessage(socket, {
            staus: 500,
            message: error.message,
          });
        }
      });

      /**
       * @event : "update_settings"
       * @param : [roomId,playerId,[round,difficulty,maxPlayers,minWordLength,wordCount,drawTime]] = data
       * @description : "update the game settings"
       * @returns : data broadcasteed : event : "updated_settings"
       *
       */
      socket.on("update_settings", async (data: Array<any>) => {
        try {
          const roomId = data[0];
          const playerId = data[1];
          const { gameCode, gameId } = this.getGameCodeAndId(roomId);
          const settings = data.splice(2);
          const settingsData = HelperUtilities.prepareSesttingData(settings);

          await GameUtility.updateGameSettings(
            gameCode,
            gameId,
            playerId,
            settingsData
          );
          this.boradcastMessage("updated_settings", roomId, settings);
        } catch (error) {
          logger.error(
            `Error at update_settings with message : ${error.message}`
          );
          this.sendErrorMessage(socket, {
            status: 500,
            message: error.message,
          });
        }
      });

      /**
       * @event : "word_options"
       * @param : [roomId,playerId,difficulty,minWordLength,wordCount]
       * @description : "player demand for the words options for drawing"
       * @return : data emited : event : "words"
       * @meta : difficulty_level => 1 -> 2 -> 3
       */
      socket.on("word_options", async (data) => {
        const roomId = data[0];
        const playerId = data[1];
        const { gameCode, gameId } = this.getGameCodeAndId(roomId);
        const difficultyLevel = DIFFICULTY_LEVEL_MAPPING[data[2]];
        const min_word_length = data[3];
        const nextDifficultyLevel = (data[2] + 1) % 3;
        const max_word_length =
          nextDifficultyLevel === 1
            ? 0
            : DIFFICULTY_LEVEL_MAPPING[nextDifficultyLevel];

        const word_count = data[4];

        const setting = {
          min_word_length: Math.min(
            difficultyLevel.min_word_lenght,
            min_word_length
          ),
          word_count,
          max_word_length,
        };
        await HelperUtilities.protectedEvents(gameCode, gameId, playerId);
        const words = await GameUtility.getDrawableWordsOptions(setting);
        const key = `game:${gameCode}:${gameId}:wordOptions`;
        await redisClient.rPush(key, words);

        this.emitMessage(socket, "word_options", words);
      });

      /**
       * @event : "confirm_word"
       * @param : [roomId,playerId,wordIndex]
       * @description "to store the selected word for guessing"
       * @return : data broadcasted : event : "start_drawing"
       */
      socket.on("confirm_word", async (data) => {
        try {
          const [roomId, playerId, word] = data;
          const { gameCode, gameId } = this.getGameCodeAndId(roomId);
          const key = `game:${gameCode}:${gameId}:selectedWord`;
          const wordOptionKey = `game:${gameCode}:${gameId}:wordOptions`;

          await HelperUtilities.protectedEvents(gameCode, gameId, playerId);
          let index = 0;

          if (Number.isFinite(word)) {
            index = word;
          }

          const selectedword = await redisClient.lIndex(wordOptionKey, index);
          await redisClient.set(key, selectedword);
          this.boradcastMessage("start_drawing", roomId, ["OK"]);
        } catch (error) {
          logger.error(`Error at confirm_word with message : ${error.message}`);
          this.sendErrorMessage(socket, {
            status: 500,
            message: error.message,
          });
        }
      });

      /**
       * @event : "chat",
       * @param : [roomId,playerId,isAnswer,[word | chat,difficulty,time,attempts]]
       * @description : chats of plyers with ans
       * @return : data braodcasted : evnet : "chat" , "turn_ended" , "game_ended"
       */
      socket.on("chat", async (message) => {
        let guess = 404;
        const [roomId, playerId, isAnswer, data] = message;
        const chat = data[0];
        const { gameCode, gameId } = this.getGameCodeAndId(roomId);
        if (!isAnswer) {
          return this.boradcastMessage("chat", roomId, [playerId, chat, guess]);
        }
        const isOk = await HelperUtilities.processguess(
          gameCode,
          gameId,
          playerId,
          data
        );
        if (isOk) {
          const data = await GameUtility.handelTurns(gameCode, gameId);

          if (typeof data === "string") {
            return this.boradcastMessage("game_ended", roomId, ["OK"]);
          }

          return this.boradcastMessage("turn_ended", roomId, data);
        }

        return this.boradcastMessage("chat", roomId, [playerId, chat, guess]);
      });

      /**
       * @event : "drawing_time_ended"
       * @param : [roomId,playerId]
       * @description : "active turn playre can call this event to terminate their turn if no one can guess corrct word"
       * @returns : data broadcasted : event : "turn_ended"
       */
      socket.on("drawing_time_ended", async (data) => {
        const [roomId, playerId] = data;
        const { gameCode, gameId } = this.getGameCodeAndId(roomId);

        // protected event
        await HelperUtilities.protectedEvents(gameCode, gameId, playerId);

        //
        const turnData = await GameUtility.handelTurns(gameCode, gameId);
        if (typeof turnData === "string") {
          return this.boradcastMessage("game_ended", roomId, ["OK"]);
        }
        return this.boradcastMessage("turn_ended", roomId, turnData);
      });

      /**
       * @event : "metadata"
       * @param : [roomId,playerId]
       * @description : braodcast drawing board data realtime to players
       * @returns : data broadcasted : event : "metadata"
       */
      socket.on("metadata", (metadata) => {
        const [roomId, data] = metadata;
        return this.broadcastDrawingData(socket, roomId, data);
      });

      socket.on("disconnect", async () => {
        const id = this.socketIdtoRoomIdMap[socket.id];
        if (id) {
          const [gameCode, gameId, playerId] = id?.split(":");

          await HelperUtilities.handlePlayerDisconnection(
            gameCode,
            gameId,
            playerId
          );
          delete this.socketIdtoRoomIdMap[socket.id];
        } else {
          const keys = await redisClient.keys("room:*:members");
          await redisClient.del(keys);
        }
      });
    });

    this.io.on("connect_error", (err) => {
      logger.error(`connect_error due to ${err.message}`);
    });
  }

  private emitMessage(socket: Socket, event: string, data: any) {
    socket.emit(event, data);
  }

  private boradcastMessage(event: string, roomId: string, data: any) {
    this.io.to(roomId).emit(event, data);
  }

  private sendErrorMessage(socket: Socket, data: Record<string, any>) {
    socket.emit("server_error", data);
  }

  private broadcastDrawingData(socket: Socket, roomId: string, data: any) {
    socket.to(roomId).emit("metadata", data);
  }
  private broadcastErrorMessage(roomId: string, data: Record<string, any>) {
    this.io.to(roomId).emit("broadcast_error", data);
  }

  private getGameCodeAndId(roomId: string) {
    const [gameCode, gameId] = roomId.split(":");
    return { gameCode, gameId };
  }
}

export default SocketUtilities;
