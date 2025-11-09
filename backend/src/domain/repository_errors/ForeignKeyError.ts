import RepositoryError from "./RepositoryError.js";

export default class ForeignKeyError extends RepositoryError {
  constructor(message?: string) {
    super(message);
    this.name = "ForeignKeyError";
  }
}
