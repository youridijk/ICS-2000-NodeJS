import Hub from '../../kaku/Hub';
import {NextFunction, Request, RequestHandler, Response} from 'express';

export default function (hub: Hub): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const entityId = Number(req.params.entityId);

    if (!hub.devices.find(d => d.entityId === entityId)) {
      return res
        .status(404)
        .send({error: `Device with entityId ${entityId} not found`});
    }

    next();
  };
};
