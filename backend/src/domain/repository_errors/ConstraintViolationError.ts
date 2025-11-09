export default class ConstraintViolationError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "ConstraintViolationError";
  }
}
