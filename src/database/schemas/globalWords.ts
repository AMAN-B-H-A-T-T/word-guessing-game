import mongoose from "mongoose";

export const globalWordSchema = new mongoose.Schema({
  frequency_count: { type: Number, required: true },
  stem: { type: String, required: true },
  stem_valid_probability: { type: Number, required: true },
  word: { type: String, required: true },
});
