import { GameDifficultyType, Prisma } from "@prisma/client";

export interface ICreateGame {
  rounds: number;
  max_players: number;
  difficulty_level: GameDifficultyType;
  min_word_length: number;
  draw_time: number;
  word_count: number;
}

export type RedisPipelineResult<T = any> = [Error | null, T][];

export type playerWithUserDetails = Prisma.PlayersGetPayload<{
  include: { user: true };
}>;
