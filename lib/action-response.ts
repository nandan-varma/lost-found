export interface ActionSuccess<T> {
  data: T;
  success: true;
}

export interface ActionError<E = string> {
  error: E;
  success: false;
}
export type ActionResult<T, E = string> = ActionSuccess<T> | ActionError<E>;
