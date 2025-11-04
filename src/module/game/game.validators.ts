import Joi, { ObjectSchema } from "joi";
import { DIFFICULTY_LEVELS } from "../../constants/index.constants";
import IndexValidator from "../index.validators";

class GameValidators extends IndexValidator {
  static validateCreateGame() {
    const maxPlayresField = Joi.number().min(2).max(8).required().messages({
      "any.required": "Invalid max_players. max_players must not be blank.",
      "number.min": "Invalid max_players. At least 2 playres must be required.",
      "number.max": "Invalid max_players. At max 8 playres are allowed.",
    });

    const difficultyField = Joi.string()
      .valid(...DIFFICULTY_LEVELS)
      .required()
      .messages({
        "any.required":
          "Invalid difficulty_level. difficulty_level must not be blank.",
        "string.valid": "Invalid difficulty_level.",
      });

    const minWordLenghtFiled = Joi.number().min(3).max(5).required().messages({
      "any.required":
        "Invalid min_word_length. min_word_length must not be blank.",
      "number.min": "Invalid min_word_length. word_length between 3 and 5.",
      "number.max": "Invalid min_word_length. word_length between 3 and 5.",
    });

    const roundsField = Joi.number().min(3).max(10).required().messages({
      "any.required": "Invalid round. round must not be blank.",
      "number.min": "Invalid round. At least 3 rounds must be required.",
      "number.max": "Invalid max_playres. At max 10 rounds are allowed.",
    });

    const drawTimeField = Joi.number().min(30).max(120).required().messages({
      "any.required": "Invalid draw_time. round must not be blank.",
      "number.min": "Invalid draw_time. Minimum draw_time must be 30 seconds.",
      "number.max": "Invalid draw_time. Maximum draw_time must be 120 seconds.",
    });

    const wordCountFiled = Joi.number().min(3).max(5).required().messages({
      "any.required": "Invalid word_count. round must not be blank.",
      "number.min":
        "Invalid word_count. At least 3 word_count must be required.",
      "number.max": "Invalid word_count. At max 5 word_count are allowed.",
    });

    const objectSchema: ObjectSchema = Joi.object({
      rounds: roundsField,
      max_players: maxPlayresField,
      difficulty_level: difficultyField,
      min_word_length: minWordLenghtFiled,
      draw_time: drawTimeField,
      word_count: wordCountFiled,
    });

    return objectSchema;
  }

  static validateAddplayerRequestBody() {
    const gameIdField = Joi.string().empty("").required().messages({
      "any.required": "Invalid game_id.game_id must be required.",
      "string.empty": "Invalid game_id.game_id must not be blank.",
    });

    const gameCodeField = Joi.string().empty("").length(6).required().messages({
      "any.required": "Invalid game_code. game_code must be required.",
      "string.empty": "Invalid game_code. game_code must not be blank.",
      "string.length": "Invalid game_code. game_code must be of 6 characteres.",
    });

    const objectSchema: ObjectSchema = Joi.object({
      game_id: gameIdField,
      game_code: gameCodeField,
    });

    return objectSchema;
  }
}

export default GameValidators;
