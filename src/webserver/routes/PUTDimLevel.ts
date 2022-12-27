import DimDevice from '../../kaku/devices/DimDevice';
import {Request, Response} from 'express';

export default async (req: Request, res: Response) => {
  const {local} = req.query;
  // eslint-disable-next-line eqeqeq
  const sendLocal = local == null ? true : local === '1' || local === 'true';
  const {device} = req;
  const dimLevel = Number(req.params.dimLevel);

  try {
    if (device instanceof DimDevice) {
      await device.dim(dimLevel, sendLocal);

      res
        .status(204)
        .send();
    } else {
      res
        .status(400)
        .send({error: `Device with entityId ${device?.entityId} is not dimmable`});
    }

  } catch (e) {
    res
      .status(500)
      .send({error: `Error turning device on or off: ${e}`});
  }
};
