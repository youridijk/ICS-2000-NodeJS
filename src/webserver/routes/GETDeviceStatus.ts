import {Request, Response} from 'express';
import DimDevice from '../../kaku/devices/DimDevice';

export default async (req: Request, res: Response) => {
  const {device} = req;
  const [isOn, status] = await Promise.all([device?.getOnStatus(), device?.getStatus()]);
  let statusObject;

  if (device instanceof DimDevice) {
    const dimLevel = await device.getDimLevel();
    statusObject = {isOn, dimLevel, status};
  } else {
    statusObject = {isOn, status};
  }

  res
    .status(200)
    .send(statusObject);
};
