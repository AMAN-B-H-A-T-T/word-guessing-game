import http from "http";
import App from "./configurations/app.configurations";
import { PORT, SERVICE_NAME } from "./configurations/env.configurations";
import logger from "./configurations/logger.configurations";
import database from "./database";
import { createRedisClient } from "./configurations/redis.configurations";

const startApp = async () => {
  // create database connection
  await database["prismaDrawPandasDB"].$connect();

  // create redis connection
  await createRedisClient();

  const appInstance = new App();
  const server: http.Server = appInstance.server;

  server.listen(PORT, () => {
    logger.info(`${SERVICE_NAME} is listing on port ${PORT}`);
  });
};

startApp();
