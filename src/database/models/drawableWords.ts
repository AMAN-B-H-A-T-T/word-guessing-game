import MongoDrawPandasDB from "../mongoConnection";
import { globalWordSchema } from "../schemas/globalWords";

const drawableWords = MongoDrawPandasDB.model(
  "drawable_words",
  globalWordSchema,
  "drawable_words"
);

export default drawableWords;
