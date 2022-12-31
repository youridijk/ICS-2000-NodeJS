import Hub from '../../kaku/Hub';
import {NextFunction, Request, Response} from 'express';

export default function (sendCommandsLocal: boolean, hub: Hub) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.hub = hub;
    req.sendCommandsLocal = sendCommandsLocal;
    next();
  };
}
