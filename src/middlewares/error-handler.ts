export const ErrorHandler = (
  err: Error,
  req: Request,
  next: NextFunction,
) => {
  logger.error("Unhandled error in request processing", {