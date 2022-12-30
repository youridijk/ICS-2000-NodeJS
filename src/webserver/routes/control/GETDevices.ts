import {Request, Response} from 'express';

export default async (req: Request, res: Response) => {
  const devices = req.hub.devices
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
