export default class HttpError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "HttpError";
  }
}
