import {Request, Response} from 'express';
import DimDevice from '../../../kaku/entities/DimDevice';
import SwitchDevice from '../../../kaku/entities/SwitchDevice';
import ColorTemperatureDevice from '../../../kaku/entities/ColorTemperatureDevice';

export default async (req: Request, res: Response) => {
  const {device} = req;
  const status = await device.getStatus();
  let statusObject;

  if (device instanceof SwitchDevice) {
    const isOn = await device.getOnStatus();
    statusObject = {isOn};
  }

  if (device instanceof DimDevice) {
    const dimLevel = await device.getDimLevel();
    statusObject = {...statusObject, dimLevel};
  }

  if (device instanceof ColorTemperatureDevice) {
    const colorTemperature = await device.getColorTemperature();
    statusObject = {...statusObject, colorTemperature};
  }

  statusObject = {...statusObject, status};

  res
    .status(200)
    .send(statusObject);
};
