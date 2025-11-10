import { PrismaClient } from "@prisma/client";
import { POSTGRES_CONNECTION_URL } from "../configurations/env.configurations";
import mongoose from "mongoose";

const prismaDrawPandasDB: PrismaClient = new PrismaClient({
  datasources: {
    db: {
      url: POSTGRES_CONNECTION_URL,
    },
  },
  log: ["info", "error"],
  errorFormat: "minimal",
});

// mongodb conneciton
const mongoDBDrawPandas = mongoose.createConnection();
export default {
  prismaDrawPandasDB,
};
