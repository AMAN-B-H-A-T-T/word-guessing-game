import { GameDifficultyType } from "@prisma/client";

export const RANDOM_ID_STRING_LENGTH = 8;
export const CHAR_SET =
  "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const HEADER_CONSTS = {
  SPEED_REQUEST_HEADER: "request-id",
};

export const PRODUCTION = "production";
export const DEVELOPMENT = "development";

// Default alphabet without "_"
export const ALPHA_NUMERIC =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-";

// HTTP status code
export const STATUS_CODES = {
  OK: 200,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
  UNAUTORIZED: 401,
  NOT_FOUND: 404,
  CREATED: 201,
  FORBIDDEN: 403,
};

// module constants
export const PROFILE = "profile";
export const GAME = "game";
export const DIFFICULTY_LEVELS = Object.keys(GameDifficultyType).map(
  (difficulty) => difficulty
);

// BCRYPT constants
export const SALT_ROUNDES = 10;

// JWT expire time
export const EXPIRE_TIME = "30d";

//API constants
export enum API_MODE {
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL",
}

export const DIFFICULTY_LEVEL_MAPPING: Record<number, any> = {
  0: { name: "EASY", min_word_lenght: 3 },
  1: { name: "MEDIUM", min_word_lenght: 5 },
  2: { name: "HARD", min_word_lenght: 7 },
};
