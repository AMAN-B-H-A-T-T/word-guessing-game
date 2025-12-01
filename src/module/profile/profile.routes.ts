import { Router } from "express";
import { CREATE, ID, LOGIN } from "../../constants/endpoint.constants";
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
    this.route.get(ID, profileController.getPlayerProfile);
  }
}

export default new ProfileRoutes().route;
