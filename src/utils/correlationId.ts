import { AsyncLocalStorage } from "async_hooks";
import type { Request, Response, NextFunction } from "express";

const asyncLocalStorage = new AsyncLocalStorage<Map<string, string>>();

export const correlationMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
  const store = new Map<string, string>();
  store.set("correlationId", crypto.randomUUID());
  asyncLocalStorage.run(store, next);
};

export const getCorrelationId = (): string => {
  return asyncLocalStorage.getStore()?.get("correlationId") || "system";
};
