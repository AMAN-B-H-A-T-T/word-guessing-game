import MongoDrawPandasDB from "../mongoConnection";
import { globalWordSchema } from "../schemas/globalWords";

const globalWordModel = MongoDrawPandasDB.model(
  "global_words",
  globalWordSchema,
  "global_words"
);

export default globalWordModel;
