import HttpError from "./HttpError.js";

export default class NotFoundError extends HttpError {
  constructor(message?: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
