import logger from "../configurations/logger.configurations.js";
import redisClient from "../configurations/redis.configurations.js";

async function deleteGameTemporaryData(keyPattern: string) {
  logger.info(`🧹 Starting Redis cleanup for pattern: ${keyPattern}`);

  let cursor = "0"; // must be a string
  let totalDeleted = 0;

  do {
    const { cursor: nextCursor, keys } = await redisClient.scan(cursor, {
      MATCH: keyPattern,
      COUNT: 1000,
    });

    if (keys.length > 0) {
      await redisClient.del(keys);
      totalDeleted += keys.length;
      logger.info(`🗑️ Deleted ${keys.length} keys in this batch`);
    }

    cursor = nextCursor as string;
  } while (cursor !== "0");

  logger.info(`✅ Cleanup done. Total deleted keys: ${totalDeleted}`);
}

export async function gracefulShutdown() {
  try {
    logger.info("🧹 Cleaning up Redis before shutdown...");
    await deleteGameTemporaryData("room:*:members");
  } catch (err) {
    logger.error("Error during Redis cleanup:", err);
  } finally {
    await redisClient.quit();
    process.exit(0);
  }
}
