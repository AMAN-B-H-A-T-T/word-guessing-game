import { createClient } from "redis";
import { REDIS_CONNECTION_URL } from "./env.configurations";
import logger from "./logger.configurations";

let retryCount = 0;
const MAX_RETRIES = 5;
const redisClient = createClient({
  url: REDIS_CONNECTION_URL,
  socket: {
    reconnectStrategy: (retries) => {
      retryCount = retries;
      if (retries > MAX_RETRIES) {
        logger.error("Max Redis reconnect attempts reached. Stopping...");
        setTimeout(() => {
          redisClient.quit().catch(() => redisClient.disconnect());
        }, 0);
        return null; // Stop retrying
      }
      logger.warn(`Redis reconnect attempt #${retries}`);
      return Math.min(5_000); // wait time before next retry (ms)
    },
  },
});

redisClient.on("connect", () => {
  logger.info("Redis client is conneted!!.");
});

redisClient.on("ready", () => {
  logger.info("Redis client is fully connected and authenticated!");
});
redisClient.on("error", (err) => {
  logger.error(`Error while connectiong to redis with message : ${err}`);
});

export async function createRedisClient() {
  await redisClient.connect();
}

export default redisClient;
