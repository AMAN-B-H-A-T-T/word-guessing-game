export enum AccessRole {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}
export interface IValidationSpec {
  [key: string]: IRequestValidationSpec;
}

export interface IRequestValidationSpec {
  headers?: string;
  body?: string;
  params?: string;
  query?: string;
  meta?: Record<string, any>;
  access?: AccessRole;
}
