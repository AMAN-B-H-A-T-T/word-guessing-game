import { Router } from "express";
import { CREATE } from "../../constants/endpoint.constants";
import profileController from "./profile.controller";

class ProfileRoutes {
  public route: Router;
  constructor() {
    this.route = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.route.post(CREATE, profileController.createUserProfile);
  }
}

export default new ProfileRoutes().route;
