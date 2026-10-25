import {NextFunction, Request, Response} from 'express';
import Hub from '../../kaku/Hub';

export default function (req: Request, res: Response, next: NextFunction) {
  const {email, password} = req.headers;
  const aesKey = req.get('aesKey');
  const hubMac = req.get('hubMac');
  const homeId = req.get('homeId');

  if (!email || !password) {
    return res
      .status(401)
      .send({error: 'Email and password in the headers is required'});
  }

  req.hub = new Hub(email!.toString(), password!.toString());

  if (hubMac) {
    req.hub.setHubMac(hubMac.toString());
  }

  if (aesKey) {
    req.hub.setAesKey(aesKey.toString());
  }

  if (homeId) {
    req.hub.setHomeId(homeId);
  }

  req.sendCommandsLocal = false;
  next();
}
