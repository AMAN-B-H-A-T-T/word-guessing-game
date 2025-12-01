import express from "express";
import cors from "cors";
import rTracer from "cls-rtracer";
import CommonUtilities from "../utilities/commonUtilities";
import { initializeTracer } from "./logger.configurations";
import { HEADER_CONSTS } from "../constants/index.constants";
import indexMiddleware from "../module/index.middleware";
import indexRouter from "../module/index";
import http from "http";
import { Server } from "socket.io";
import SocketUtilities from "../utilities/socket.utilities";

class App {
  public app: express.Express;
  public server: http.Server;

  constructor() {
    this.app = express();
    this.configurations();

    this.server = http.createServer(this.app);
    const io = new Server(this.server, { cors: { allowedHeaders: "*" } });

    new SocketUtilities(io);
  }

  private configurations(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(
      cors({
        origin: "http://localhost:3000",
        credentials: true,
        exposedHeaders: ["account-id"],
      })
    );

    this.app.use(
      rTracer.expressMiddleware({
        requestIdFactory: () => {
          const id: string = CommonUtilities.generateRandomID(null, 19);
          initializeTracer(id);
          return id;
        },
        headerName: HEADER_CONSTS.SPEED_REQUEST_HEADER,
        useHeader: true,
      })
    );

    this.app.use(indexMiddleware.setRequestId);
    this.app.use(indexMiddleware.setRequestTime);

    this.app.use(indexRouter);
  }
}
export default App;
