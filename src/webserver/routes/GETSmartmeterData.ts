import {Request, Response} from 'express';
import Hub from '../../kaku/Hub';

export default (hub: Hub) => {
  return async (req: Request, res: Response) => {
    try {
      const smartMeterData = await hub.getSmartMeterData();
      res
        .status(200)
        .send(smartMeterData);
    } catch (e) {
      res
        .status(500)
        .send({error: `Error getting smart meter data: ${e}`});
    }
  };
};
