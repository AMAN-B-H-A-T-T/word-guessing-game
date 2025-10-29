import { Request, Response, NextFunction } from "express";

class IndexUtilities {
  static validateRequest(req: Request, res: Response, next: NextFunction) {
    const method = req.method;
    const baseUrl = req.baseUrl;
    const path = req.path;
  }
}

export default IndexUtilities;
