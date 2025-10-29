import express from "express";
import cors from "cors";
import rTracer from "cls-rtracer";
import CommonUtilities from "../utilities/commonUtilities";
import { initializeTracer } from "./logger.configurations";
import { HEADER_CONSTS } from "../constants/index.constants";
import indexMiddleware from "../module/index.middleware";
import indexRouter from "../module/index";

class App {
  public app: express.Express;

  constructor() {
    this.app = express();
    this.configurations();
  }

  private configurations(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cors());

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
