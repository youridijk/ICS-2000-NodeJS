import {Request, Response} from 'express';
import SwitchDevice from '../../../kaku/devices/SwitchDevice';

export default async (req: Request, res: Response) => {
  const turnOn = req.path.endsWith('/on');
  const {local} = req.query;
  const sendLocal = local == null ? req.sendCommandsLocal : local === '1' || local === 'true';
  const {device} = req;

  try {
    if (device instanceof SwitchDevice) {
      await device?.turnOnOff(turnOn, sendLocal);
    } else {
      return res
        .status(400)
        .send({error: 'Device can\'t be turned on or off'});
    }
  } catch (e) {
    res
      .status(500)
      .send({error: `Error turning device on or off: ${e}`});
  }
};
