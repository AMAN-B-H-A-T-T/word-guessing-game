import { Router } from "express";
import { ADD_PLAYER, CREATE } from "../../constants/endpoint.constants";
import gameController from "./game.controller";
class GameRoute {
  public router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.post(CREATE, gameController.createGame);
    this.router.post(ADD_PLAYER, gameController.addPlayerToGame);
  }
}

export default new GameRoute().router;
