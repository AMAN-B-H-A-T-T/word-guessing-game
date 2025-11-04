import { GameDifficultyType } from "@prisma/client";

export interface ICreateGame {
  rounds: number;
  max_players: number;
  difficulty_level: GameDifficultyType;
  min_word_length: number;
  draw_time: number;
  word_count: number;
}
