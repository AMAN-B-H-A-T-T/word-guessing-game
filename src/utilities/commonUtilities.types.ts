import { Request } from "express";

export type FieldTypes = string | number | boolean | object;

export interface ResponseMetadata {
  httpCode: number;
  data: any;
}

export type RequestPart = keyof Pick<
  Request,
  "body" | "params" | "query" | "headers"
>;
