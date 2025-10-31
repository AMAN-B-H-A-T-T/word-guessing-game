import { Router } from "express";
import { CREATE, LOGIN } from "../../constants/endpoint.constants";
import profileController from "./profile.controller";

class ProfileRoutes {
  public route: Router;
  constructor() {
    this.route = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.route.post(CREATE, profileController.createUserProfile);
    this.route.post(LOGIN, profileController.loginUser);
  }
}

export default new ProfileRoutes().route;
