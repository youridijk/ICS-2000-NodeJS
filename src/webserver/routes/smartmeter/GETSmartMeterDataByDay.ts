import {Request, Response} from 'express';

export default async function (req: Request, res: Response) {
  const startDateString = String(req.query.startDate ?? '');
  const endDateString = String(req.query.endDate ?? '');

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
  console.log(startDate);
  console.log(endDate, endDateString);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (startDate == 'Invalid Date' || endDate == 'Invalid Date' ) {
    return res
      .status(400)
      .send({error: 'startDate or endDate is an invalid date'});
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
