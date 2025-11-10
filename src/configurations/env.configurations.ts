require("dotenv").config();

const env = process.env;

export const PORT = Number(env.PORT ?? 8000);
export const SERVICE_NAME = env.SERVICE_NAME;
export const POSTGRES_CONNECTION_URL = env.POSTGRES_CONNECTION_URL;
export const REDIS_CONNECTION_URL = env.REDIS_CONNECTION_URL;
export const JWT_KEY = env.JWT_KEY;
export const MONGO_CONNECTION_URL = `${env.MONGO_CONNECTION_URL}/db_draw_pandas`;
export const ENVIRONMENT = env.ENVIRONMENT ?? "development";
