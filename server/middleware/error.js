class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.status = statusCode;
  }
}

export const errMiddleware = (err, req, res, next) => {
  err.message = err.message || "Internal error";
  err.status = err.status || 400;

  return res.status(err.status).json({
    success: false,
    message: err.message,
  });
};

export default ErrorHandler;
