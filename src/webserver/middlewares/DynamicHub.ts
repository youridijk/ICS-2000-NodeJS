import {NextFunction, Request, Response} from 'express';
import Hub from '../../kaku/Hub';

export default function (req: Request, res: Response, next: NextFunction) {
  const {email, password, aesKey, hubMac} = req.headers;

  if (!email || !password) {
    return res
      .status(401)
      .send({error: 'Email and password in the headers is required'});
  }

  req.hub = new Hub(String(email), String(password), String(hubMac), String(aesKey));
  next();
}
