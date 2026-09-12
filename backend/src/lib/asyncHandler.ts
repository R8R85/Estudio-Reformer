import type { NextFunction, Request, Response } from 'express';

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Express 4 doesn't await async route handlers itself — this forwards any
// rejected promise into next(err) so our error middleware can render it.
export const asyncHandler = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res, next).catch(next);
};
