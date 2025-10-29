import { CREATE } from "../constants/endpoint.constants";

export const RequestValidationMapping = {
  GET: {},
  POST: {
    create: CREATE,
  },
  PUT: {},
};

export const apiNameMap = {
  profile: [CREATE],
};
