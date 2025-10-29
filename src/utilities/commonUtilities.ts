import { NextFunction, Request, Response } from "express";
import {
  CHAR_SET,
  PROFILE,
  RANDOM_ID_STRING_LENGTH,
} from "../constants/index.constants";
import {
  FieldTypes,
  RequestPart,
  ResponseMetadata,
} from "./commonUtilities.types";
import LatestSpec from "../validators/latestSpec";
import logger from "../configurations/logger.configurations";
import ProfileValidators from "../module/profile/profile.validatior";

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
    return moduleName.toUpperCase();
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
    if (module === PROFILE) {
      return ProfileValidators;
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
          abortEarly: false, // show all errors, not just the first one
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
}

export default CommonUtilities;
