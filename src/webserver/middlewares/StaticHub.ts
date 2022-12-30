import Hub from '../../kaku/Hub';
import {NextFunction, Request, Response} from 'express';

export default function (hub: Hub) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.hub = hub;
    next();
  };
}
