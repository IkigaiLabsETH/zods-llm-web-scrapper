import { Request, Response, NextFunction } from 'express';

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

export function extendedTimeout(
   req: Request,
   res: Response,
   next: NextFunction
) {
   res.setTimeout(FIVE_MINUTES_IN_MS, () => {
      res.status(503).send(
         'Service unavailable. Request timeout exceeded. Please retry.'
      );
   });
   next();
}
