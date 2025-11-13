import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
  ALPHA_NUMERIC,
  CHAR_SET,
  EXPIRE_TIME,
  GAME,
  PROFILE,
  RANDOM_ID_STRING_LENGTH,
  SALT_ROUNDES,
  STATUS_CODES,
} from "../constants/index.constants";
import {
  FieldTypes,
  RequestPart,
  ResponseMetadata,
} from "./commonUtilities.types";
import LatestSpec from "../validators/latestSpec";
import logger from "../configurations/logger.configurations";
import ProfileValidators from "../module/profile/profile.validatior";
import HttpException from "../exceptions/httpException";
import { JWT_KEY } from "../configurations/env.configurations";
import GameValidators from "../module/game/game.validators";
import { AccessRole } from "../validators/validationSpecs.types";
import BadRequestException from "../exceptions/badRequestException";
const { INTERNAL_SERVER_ERROR } = STATUS_CODES;
class CommonUtilities {
  static generateRandomID(
    prefix?: string,
    length?: number,
    addMs?: number
  ): string {
    let id: string;
    let idLength: number;
    let timestamp = Date.now();
    // If addMs provided add it in timestamp
    if (addMs) {
      timestamp += addMs;
    }
    const timestampString = timestamp.toString(36);
    id = timestampString;
    // if length is given, calculate the remaining length of characters
    // to be appended to the ID
    idLength = length ? length - id.length : RANDOM_ID_STRING_LENGTH;

    for (let i = 0; i < idLength; ++i) {
      const randomPosition = Math.round(Math.random() * CHAR_SET.length);
      id += CHAR_SET.charAt(randomPosition);
    }

    return prefix ? `${prefix}_${id}` : id;
  }

  /*
   *  @param field [FieldTypes] field to be checked for emptiness
   *  @param withoutZero [boolean] whether to check falseness of zero (0) or not i.e. if false, zero will be falsy, otherwise, zero will not be falsy
   *  @description check if the given field is empty
   */
  static isEmpty(field: FieldTypes, withoutZero?: boolean): boolean {
    if (!field) {
      // apply check on withoutZero flag only if field is zero
      if (field === 0) {
        return !withoutZero;
      }

      return true;
    }

    if (field instanceof Array) {
      if (!field.length) {
        return true;
      }
    }

    if (field instanceof Object) {
      const keys = Object.keys(field);

      if (!keys.length) {
        return true;
      }
    }

    return false;
  }

  static sendResponse(response: Response, metadata: ResponseMetadata) {
    return response.status(metadata.httpCode).json(metadata.data);
  }

  static getModuleName(baseurl: string) {
    if (!baseurl || baseurl === "") {
      throw new Error("Base-url is missing.");
    }
    const moduleName = baseurl.split("/").at(-1);
    return moduleName;
  }

  static getModuleNameFromUrl(baseUrl: string): string {
    if (CommonUtilities.isEmpty(baseUrl)) {
      return null;
    }

    /* splitting the base URL to extract the URL components,
     extracting the last URL component assuming it's the module path,
     fetch the module name from modulepath 
     */

    const splitModuleName: string[] = baseUrl.split("/").pop().split("-");
    // capitalize every word (except the first one)
    const moduleName = splitModuleName.map((word: string, index: number) => {
      // if index is 0 then we know it's the first word
      // and return the word as it is
      if (index === 0) {
        return word;
      }
      return word;
    });

    // join the array into string without any delimiter
    return moduleName.join("");
  }

  static getAPINameFromUrl(
    method: string,
    path: string,
    apiNameMap: Record<string, any>
  ): string {
    if (CommonUtilities.isEmpty(path)) {
      return null;
    }

    if (!path) {
      return null;
    }

    // split all the components of path, for example,
    // /hello/world -> ['hello', 'world']
    // this will help us in extracting out the appropriate
    // API URL that was hit
    let splitPath = path.split("/").filter((p) => p);
    let mappingPath: string;

    // for root paths (i.e. / only paths), the array will
    // be empty because there are no components in the path
    if (!splitPath.length) {
      mappingPath = "root";
    } else {
      // filter out the path components not containing an ID
      // as path parameter, in such case, we can assign the
      // first path component for mapping, otherwise,
      // we select 'with-id' API name, because an ID was
      // passed as a path parameter
      // e.g. /plink_123455 -> 'with-id' because splitPath will
      // be empty and /plink_1321234/payments -> payments because
      // splitPath will be ['payments']
      splitPath = splitPath.filter((sp) => !sp.includes("_"));
      if (!splitPath.length) {
        mappingPath = "with-id";
      } else {
        mappingPath = splitPath[0];

        if (!(mappingPath in apiNameMap[method])) {
          mappingPath = "with-id";
        }
      }
    }

    const apiName = apiNameMap[method][mappingPath] as string;

    return apiName;
  }

  static getModuleValidators(module: string) {
    switch (module) {
      case PROFILE:
        return ProfileValidators;
      case GAME:
        return GameValidators;
      default:
        throw new Error("module validators is not found.");
    }
  }

  static validateRequest(
    apiNameMap: Record<string, any>,
    latestSpec: LatestSpec
  ) {
    return async (
      request: Request<{}, {}, {}>,
      response: Response,
      next: NextFunction
    ) => {
      try {
        const method: string = request.method,
          baseUrl: string = request.baseUrl,
          path: string = request.path;

        let apiRequestSpecs: any = null;
        const moduleName: string =
          CommonUtilities.getModuleNameFromUrl(baseUrl);
        const apiName: string = CommonUtilities.getAPINameFromUrl(
          method,
          path,
          apiNameMap
        );
        apiRequestSpecs = latestSpec.getModule(moduleName).validationSpec;

        apiRequestSpecs = apiRequestSpecs[apiName];

        // validate request
        const errors = await this.validateAPIRequestSpecComponent(
          request,
          apiRequestSpecs,
          moduleName
        );

        if (errors.length) {
          return response.status(400).json({ errors });
        }
        next();
      } catch (error) {
        logger.error(`Error at validateRequest with message ${error.message}`);

        return response.status(400).json({
          error: error.message,
        });
      }
    };
  }

  static validateRequestAccees(
    apiNameMap: Record<string, any>,
    latestSpec: LatestSpec
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { headers } = req;
        const accountId = headers["account-id"];
        const method: string = req.method,
          baseUrl: string = req.baseUrl,
          path: string = req.path;

        let apiRequestSpec: any = null;
        const moduleName: string = CommonUtilities.getModuleName(baseUrl);
        const apiName: string = CommonUtilities.getAPINameFromUrl(
          method,
          path,
          apiNameMap
        );
        apiRequestSpec = latestSpec.getModule(moduleName).validationSpec;
        apiRequestSpec = apiRequestSpec[apiName];
        const accessType = apiRequestSpec.access;
        if (accessType === AccessRole.PUBLIC) {
          next();
          return;
        }

        let accessToken: string = headers["authorization"];
        accessToken = accessToken.replace("Bearer ", "");

        try {
          const decodedData: JwtPayload = CommonUtilities.verifyToken(
            accessToken
          ) as JwtPayload;

          if (decodedData?.id !== accountId) {
            throw new BadRequestException(
              "The access token does not match the requested user context.",
              "invalid_token_scope"
            );
          }

          next();
        } catch (error) {
          logger.error(`Error while verify token, message : ${error.message}`);
          return CommonUtilities.sendErrorResponse(res, error);
        }
      } catch (error) {
        logger.error(
          `Error at validateRequestAccees with message : ${error.message}`
        );
        return CommonUtilities.sendErrorResponse(res, error);
      }
    };
  }

  static async validateAPIRequestSpecComponent(
    req: Request,
    schemas: Record<string, any>,
    moduleName: string
  ) {
    const parts: RequestPart[] = ["headers", "params", "query", "body"];
    const errors = [];
    const validator = this.getModuleValidators(moduleName);
    for (const part of parts) {
      if (schemas[part]) {
        const fun: any = schemas[part];
        const objectSchema = (validator as any)[fun]?.();
        const { error } = objectSchema.validate(req[part], {
          abortEarly: true, // show all errors, not just the first one
          allowUnknown: part === "headers", // allow unknown headers
        });
        if (error) {
          errors.push(
            ...error.details.map((detail: any) => ({
              field: detail.path.join("."),
              message: detail.message,
            }))
          );
        }
      }
    }

    return errors;
  }

  static sendErrorResponse(response: Response, error: Error) {
    let message = null,
      httpCode = INTERNAL_SERVER_ERROR,
      type = "internal_server_error";

    if (error instanceof HttpException) {
      message = error.message;
      httpCode = error.statusCode;
      type = error.type;
    } else {
      message = error.message;
    }

    this.sendResponse(response, {
      httpCode,
      data: {
        errors: [
          {
            type,
            message,
          },
        ],
      },
    });
  }

  static generateEncryptedPassword(password: any): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDES);
  }

  static decryptAndComparePassword(
    hashedPassword: string,
    plainPassword: string
  ) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static generateAuthToken(data: Record<string, any>) {
    const token = jwt.sign(data, JWT_KEY, { expiresIn: EXPIRE_TIME });
    return token;
  }

  static verifyToken(token: string) {
    const profile = jwt.verify(token, JWT_KEY);
    return profile;
  }

  static async generateRoomId(size: number = 6) {
    const { customAlphabet } = await import("nanoid");
    return customAlphabet(ALPHA_NUMERIC, size)().toUpperCase();
  }

  static calculateScore(
    isCorrect: boolean,
    base: number,
    timeTaken: number,
    difficultyLevel: number,
    attempts: number
  ) {
    if (!isCorrect) return -10 * attempts; // penalty

    const timeBonus = Math.max(0, 50 - timeTaken); // faster = more bonus
    const difficultyMultiplier = difficultyLevel * 1.5;
    const attemptPenalty = (attempts - 1) * 10;

    return (base + timeBonus) * difficultyMultiplier - attemptPenalty;
  }
}

export default CommonUtilities;
