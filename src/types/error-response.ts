export interface ErrorResponse {
  status: "error";
  message: string;
  correlationId?: string;
  stack?: string;
}
