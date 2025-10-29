import { Router } from "express";
import { PROFILE_ROUTES } from "../constants/endpoint.constants";
import profileRoutes from "./profile/profile.routes";
import LatestSpec from "../validators/latestSpec";

import { RequestValidationMapping } from "../validators/validatorMapping";
import CommonUtilities from "../utilities/commonUtilities";

class IndexRoute {
  public router: Router;
  public latestSpec: LatestSpec;
  constructor() {
    this.router = Router();
    this.latestSpec = new LatestSpec();
    this.setupRoutes();
  }

  private setupRoutes() {
    const validationMiddlewares = [
      CommonUtilities.validateRequest(
        RequestValidationMapping,
        this.latestSpec
      ),
    ];
    this.router.use(PROFILE_ROUTES, validationMiddlewares, profileRoutes);
  }
}

export default new IndexRoute().router;
