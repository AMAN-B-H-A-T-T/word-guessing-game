import { ADD_PLAYER, CREATE, LOGIN } from "../constants/endpoint.constants";

export const RequestValidationMapping = {
  GET: {},
  POST: {
    create: CREATE,
    login: LOGIN,
    "add-player": ADD_PLAYER,
  },
  PUT: {},
};

export const apiNameMap = {
  profile: [CREATE, LOGIN],
  game: [CREATE, ADD_PLAYER],
};
