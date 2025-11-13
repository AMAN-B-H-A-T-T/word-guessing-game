export interface IFetchQueryProps {
  whereObject?: Record<string, any>;
  selectObject?: Record<string, any>;
  includeObject?: Record<string, any>;
}

export enum playerStausType {
  offline = 0,
  online = 1,
}
