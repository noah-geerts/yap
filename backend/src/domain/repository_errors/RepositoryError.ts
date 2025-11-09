export default class RepositoryError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "RepositoryError";
  }
}
