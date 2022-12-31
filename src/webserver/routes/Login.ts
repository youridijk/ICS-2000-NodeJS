import {Request, Response} from 'express';

export default async function (req: Request, res: Response) {
  const hub = req.hub;

  const aesKey = hub.getAESKey();
  const hubMac = hub.getHubMac();

  if (aesKey == null && hubMac == null) {
    await hub.login();
  }

  res
    .status(200)
    .send({
      aesKey: hub.getAESKey(),
      hubMac: hub.getHubMac(),
    });
}
