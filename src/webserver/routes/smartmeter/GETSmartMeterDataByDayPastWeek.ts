import {Request, Response} from 'express';

export default async function (req: Request, res: Response) {
  const endDateString = String(req.body.endDate ?? '');

  if (endDateString === '') {
    return res
      .status(400)
      .send({error: 'End date is required'});
  }

  const endDate = new Date(endDateString);

  try {
    const data = await req.hub.getSmartMeterDataByDayPastWeek(endDate);
    res
      .status(200)
      .send(data);
  } catch (error) {
    res
      .status(500)
      .send({error: `${error}`});
  }
}
