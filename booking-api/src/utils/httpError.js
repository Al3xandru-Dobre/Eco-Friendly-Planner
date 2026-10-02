/**
 * A single error type carrying an HTTP status and a stable machine-readable
 * code. Routes throw these; the error middleware turns them into JSON.
 */
class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

const badRequest = (message, details) => new HttpError(400, 'BAD_REQUEST', message, details);
const unauthorized = (message = 'Authentication required') => new HttpError(401, 'UNAUTHORIZED', message);
const forbidden = (message = 'You are not allowed to perform this action') => new HttpError(403, 'FORBIDDEN', message);
const notFound = (message = 'Resource not found') => new HttpError(404, 'NOT_FOUND', message);
const conflict = (message, details) => new HttpError(409, 'CONFLICT', message, details);

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict };
