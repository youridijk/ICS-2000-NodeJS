import {Request, RequestHandler, Response} from 'express';
import Hub from '../../kaku/Hub';

export default (hub: Hub): RequestHandler => {
  return async (req: Request, res: Response) => {
    const devices = hub.devices
      .map(device => {
        return {
          'name': device.name,
          'entityId': device.entityId,
          'isGroup': device.isGroup,
          'deviceConfig': device.deviceConfig,
        };
      });

    res
      .status(200)
      .send(devices);
  };
};
