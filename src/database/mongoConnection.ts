import mongoose from "mongoose";
import { MONGO_CONNECTION_URL } from "../configurations/env.configurations";
import logger from "../configurations/logger.configurations";

const MongoDrawPandasDB = mongoose.createConnection(MONGO_CONNECTION_URL);
MongoDrawPandasDB.on("connected", () => {
  logger.info(`Successfully connected to DB!!`);
});
MongoDrawPandasDB.on("error", (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});
MongoDrawPandasDB.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});
MongoDrawPandasDB.on("reconnected", () => {
  logger.info("MongoDB reconnected successfully");
});

export default MongoDrawPandasDB;
