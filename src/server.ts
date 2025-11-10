import http from "http";
import App from "./configurations/app.configurations";
import {
  ENVIRONMENT,
  PORT,
  SERVICE_NAME,
} from "./configurations/env.configurations";
import logger from "./configurations/logger.configurations";
import database from "./database";
import { createRedisClient } from "./configurations/redis.configurations";
import { gracefulShutdown } from "./utilities/redisCleanup";
import { PRODUCTION } from "./constants/index.constants";

const startApp = async () => {
  // create database connection
  await database["prismaDrawPandasDB"].$connect();

  // create redis connection
  await createRedisClient();

  // await gracefulShutdown();
  const appInstance = new App();
  const server: http.Server = appInstance.server;

  if (ENVIRONMENT === PRODUCTION) {
    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
  }

  server.listen(PORT, () => {
    logger.info(`${SERVICE_NAME} is listing on port ${PORT}`);
  });
};

startApp();
