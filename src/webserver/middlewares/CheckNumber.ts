import {NextFunction, Request, Response} from 'express';

export default function (req: Request, res: Response, next: NextFunction) {
  const params = req.params;

  for (const paramKey in params) {
    const param = Number(params[paramKey]);

    if (isNaN(param) || param < 0) {
      return res
        .status(400)
        .send({error: `Param "${paramKey}" needs to be a number`});
    }
  }

  next();
}
