import {NextFunction, Request, Response} from 'express';

export default (req: Request, res: Response, next: NextFunction) => {
  const entityId = Number(req.params.entityId);

  const device = req.hub.devices.find(d => d.entityId === entityId);

  if (!device) {
    return res
      .status(404)
      .send({error: `Device with entityId ${entityId} not found`});
  }

  req.device = device;
  next();
};
