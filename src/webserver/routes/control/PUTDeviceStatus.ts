import {Request, Response} from 'express';

export default async (req: Request, res: Response) => {
  const {device} = req;

  const deviceFunction = Number(req.body.deviceFunction);
  const value = Number(req.body.value);

  const {local} = req.query;
  const sendLocal = local == null ? req.sendCommandsLocal : local === '1' || local === 'true';

  if (!Number.isInteger(deviceFunction) || !Number.isInteger(value)) {
    return res
      .status(400)
      .send({error: 'deviceFunction and value needs to be an integer'});
  }

  try {
    await device?.changeStatus(deviceFunction, value, sendLocal);

    res
      .status(204)
      .send();
  } catch (e) {
    res
      .status(500)
      .send({error: `Error changing device status: ${e}`});
  }
};
