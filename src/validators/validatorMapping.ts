import {
  ADD_PLAYER,
  CREATE,
  END_GAME,
  LOGIN,
} from "../constants/endpoint.constants";

export const RequestValidationMapping = {
  GET: {
    "with-id": "with-id",
  },
  POST: {
    create: CREATE,
    login: LOGIN,
    "add-player": ADD_PLAYER,
  },
  PUT: {
    "end-game": END_GAME,
  },
};

export const apiNameMap = {
  profile: [CREATE, LOGIN, "with-id"],
  game: [CREATE, ADD_PLAYER, END_GAME],
};
