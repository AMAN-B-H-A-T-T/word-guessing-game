import { Express } from "express";
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
  const app: Express = appInstance.app;
  app.listen(PORT, () => {
    logger.info(`${SERVICE_NAME} is listing on port ${PORT}`);
  });
};

startApp();
