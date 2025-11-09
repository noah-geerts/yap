import HttpError from "./HttpError.js";

export default class ConflictError extends HttpError {
  constructor(message?: string) {
    super(message);
    this.name = "ConflictError";
  }
}
