import {Request, Response} from 'express';

export default async (req: Request, res: Response) => {
  const turnOn = req.path.endsWith('/on');
  const {local} = req.query;
  // eslint-disable-next-line eqeqeq
  const sendLocal = local == null ? true : local === '1' || local === 'true';
  const {device} = req;

  try {
    await device?.turnOnOff(turnOn, sendLocal);
  } catch (e) {
    res
      .status(500)
      .send({error: `Error turning device on or off: ${e}`});
  }
};
