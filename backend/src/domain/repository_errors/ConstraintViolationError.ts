import RepositoryError from "./RepositoryError.js";

export default class ConstraintViolationError extends RepositoryError {
  constructor(message?: string) {
    super(message);
    this.name = "ConstraintViolationError";
  }
}
