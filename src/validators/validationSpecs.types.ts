export interface IValidationSpec {
  [key: string]: IRequestValidationSpec;
}
export interface IRequestValidationSpec {
  header?: string;
  body?: string;
  params?: string;
  query?: string;
}
