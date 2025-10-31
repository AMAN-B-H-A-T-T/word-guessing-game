import { CREATE, LOGIN } from "../constants/endpoint.constants";

export const RequestValidationMapping = {
  GET: {},
  POST: {
    create: CREATE,
    login: LOGIN,
  },
  PUT: {},
};

export const apiNameMap = {
  profile: [CREATE, LOGIN],
};
