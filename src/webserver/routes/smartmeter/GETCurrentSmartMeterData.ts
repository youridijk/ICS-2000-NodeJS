import {Request, Response} from 'express';

export default async (req: Request, res: Response) => {
    try {
      const smartMeterData = await req.hub.getSmartMeterData();
      res
        .status(200)
        .send(smartMeterData);
    } catch (e) {
      res
        .status(500)
        .send({error: `Error getting smart meter data: ${e}`});
    }
}
