/**
 * Application errors. Services throw these; the route wrapper (lib/http/handler.ts)
 * turns them into a consistent JSON response. Nothing outside lib/http knows about HTTP bodies.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "The request is invalid.", code = "VALIDATION_ERROR", details?: unknown) {
    super(400, code, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required.", code = "UNAUTHENTICATED") {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do this.", code = "FORBIDDEN") {
    super(403, code, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found.", code = "NOT_FOUND") {
    super(404, code, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = "CONFLICT") {
    super(409, code, message);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(429, "RATE_LIMITED", message);
  }
}

export class UpstreamError extends AppError {
  constructor(message = "An upstream service failed. Please try again.") {
    super(502, "UPSTREAM_ERROR", message);
  }
}
