import { PrismaClient } from "@prisma/client";
import { POSTGRES_CONNECTION_URL } from "../configurations/env.configurations";

const prismaDrawPandasDB: PrismaClient = new PrismaClient({
  datasources: {
    db: {
      url: POSTGRES_CONNECTION_URL,
    },
  },
  log: ["info", "error"],
  errorFormat: "minimal",
});

export default {
  prismaDrawPandasDB,
};
