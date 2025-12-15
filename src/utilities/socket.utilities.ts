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
       * @returns : data broadcasted : event : 'round_data'
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
          const settings = data[2];
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
       * @return : data emited : event : "word_options"
       * @meta : difficulty_level => 1 -> 2 -> 3
       */
      socket.on("word_options", async (data) => {
        try {
          const roomId = data[0];
          const playerId = data[1];
          const { gameCode, gameId } = this.getGameCodeAndId(roomId);
          const difficultyLevel = DIFFICULTY_LEVEL_MAPPING[data[2]];
          const min_word_length = Number(data[3]);
          const word_count = Number(data[4]);
          const nextUpDifficulty =
            DIFFICULTY_LEVEL_MAPPING[difficultyLevel + 1];
          const maxWordLenght =
            nextUpDifficulty !== undefined
              ? nextUpDifficulty.min_word_lenght
              : 10;
          const setting = {
            min_word_length: Math.min(
              difficultyLevel.min_word_lenght,
              min_word_length
            ),
            word_count,
            max_word_length: maxWordLenght,
          };
          await HelperUtilities.protectedEvents(gameCode, gameId, playerId);
          const words = await GameUtility.getDrawableWordsOptions(setting);
          const key = `game:${gameCode}:${gameId}:wordOptions`;
          await redisClient.del(key);
          await redisClient.rPush(key, words);

          this.emitMessage(socket, "word_options", words);
        } catch (error) {
          this.sendErrorMessage(socket, {
            status: 500,
            message: error.message,
          });
        }
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
        try {
          let guess = 404;
          const [roomId, playerId, isAnswer, data] = message;
          const chat = data[0];
          const { gameCode, gameId } = this.getGameCodeAndId(roomId);
          const selectedWordKey = `game:${gameCode}:${gameId}:selectedWord`;
          if (!isAnswer) {
            return this.boradcastMessage("chat", roomId, [
              playerId,
              chat,
              guess,
            ]);
          }
          const isOk = await HelperUtilities.processguess(
            gameCode,
            gameId,
            playerId,
            data
          );
          if (isOk) {
            const word = await redisClient.get(selectedWordKey);
            return this.boradcastMessage("correct_guessed", roomId, [
              playerId,
              word,
            ]);
          }

          return this.boradcastMessage("chat", roomId, [playerId, chat, guess]);
        } catch (error) {
          logger.error(`Error at chat with message : ${error.message}`);
          this.sendErrorMessage(socket, {
            status: 500,
            message: error.message,
          });
        }
      });

      socket.on("round_data", async (message) => {
        const [roomId, playerId] = message;
        try {
          const { gameCode, gameId } = this.getGameCodeAndId(roomId);
          const data = await GameUtility.handelTurns(gameCode, gameId);

          if (typeof data === "string") {
            return this.boradcastMessage("game_ended", roomId, ["OK"]);
          }

          return this.boradcastMessage("round_data", roomId, data);
        } catch (error) {
          logger.error(
            `Error at round_data game-${roomId}-${playerId} with message : ${error.message}`
          );
          this.sendErrorMessage(socket, {
            status: 500,
            message: error.message,
          });
        }
      });

      /**
       * @event : "drawing_time_ended"
       * @param : [roomId,playerId]
       * @description : "active turn playre can call this event to terminate their turn if no one can guess corrct word"
       * @returns : data broadcasted : event : "turn_ended"
       */
      socket.on("drawing_time_ended", async (data) => {
        const [roomId, playerId] = data;
        try {
          const { gameCode, gameId } = this.getGameCodeAndId(roomId);
          const key = `game:${gameCode}:${gameId}:selectedWord`;
          const selectedWord = await redisClient.get(key);
          // protected event
          await HelperUtilities.protectedEvents(gameCode, gameId, playerId);

          return this.boradcastMessage("turn_ended", roomId, [selectedWord]);
        } catch (error) {
          logger.error(
            `Error at drawing_time_ended game: ${roomId}-${playerId} with message : ${error.message}`
          );
          this.sendErrorMessage(socket, {
            status: 500,
            message: error.message,
          });
        }
      });

      /**
       * @event : "metadata"
       * @param : [roomId,playerId]
       * @description : braodcast drawing board data realtime to players
       * @returns : data broadcasted : event : "metadata"
       */
      // socket.on("metadata", (metadata) => {
      //   const [roomId, data] = metadata;
      //   return this.broadcastDrawingData(socket, roomId, data);
      // });

      socket.on("disconnect", async () => {
        const id = this.socketIdtoRoomIdMap[socket.id];
        try {
          if (id) {
            const [gameCode, gameId, playerId] = id?.split(":");

            const response = await HelperUtilities.handlePlayerDisconnection(
              gameCode,
              gameId,
              playerId
            );
            if (typeof response === "object") {
              this.boradcastMessage(
                "game_data",
                `${gameCode}:${gameId}`,
                response
              );
            }
            delete this.socketIdtoRoomIdMap[socket.id];
          }
        } catch (error) {
          logger.error(
            `Error at disconnect socket: ${id} with message : ${error.message}`
          );
          this.sendErrorMessage(socket, {
            status: 500,
            message: error.message,
          });
        }
      });

      /**
       * ============================================
       * REAL-TIME DRAWING WITH ZERO-COPY BROADCASTING
       * =============================================
       */

      // Batched strokes - most efficient
      socket.on("stroke-batch", (data) => {
        const roomId = data.roomId;

        // Direct broadcast - no processing, just relay
        this.emitToRoom(socket, "stroke-batch", roomId, data);
      });

      // Single critical strokes (fills, etc.)
      socket.on("single-stroke", (data) => {
        const roomId = data.roomId;

        // Direct broadcast
        this.emitToRoom(socket, "single-stroke", roomId, data);
      });

      // Canvas clear
      socket.on("canvas-clear", (data) => {
        const roomId = data.roomId;

        // Direct broadcast
        this.emitToRoom(socket, "canvas-clear", roomId, data);
      });

      // Complete drawing sync (for new users)
      socket.on("drawing-sync", (data) => {
        const roomId = data.roomId;

        // Broadcast to room
        this.emitToRoom(socket, "drawing-sync", roomId, data);
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

  private emitToRoom(socket: Socket, event: string, roomId: string, data: any) {
    socket.to(roomId).emit(event, data);
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
