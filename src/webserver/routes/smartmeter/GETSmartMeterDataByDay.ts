import {Request, Response} from 'express';

export default async function (req: Request, res: Response) {
  const startDateString = String(req.body.startDate ?? '');
  const endDateString = String(req.body.endDate ?? '');

  if (startDateString === '' || endDateString === '') {
    return res
      .status(400)
      .send({error: 'Start date and end date are required'});
  }

  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);


  if (startDate.getTime() > endDate.getTime()) {
    return res
      .status(400)
      .send({error: 'Start date needs to be before end date'});
  }

  try {
    const data = await req.hub.getSmartMeterDataByDay(startDate, endDate);
    res
      .status(200)
      .send(data);
  } catch (error) {
    res
      .status(500)
      .send({error: `${error}`});
  }
}
