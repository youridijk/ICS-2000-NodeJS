import {Request, RequestHandler, Response} from 'express';
import RESTServer from '../RESTServer';

export default (server: RESTServer): RequestHandler => {
  return async (req: Request, res: Response) => {
    try {
      await server.setup();
      res
        .status(200)
        .send();
    } catch (e) {
      res
        .status(500)
        .send({error: `Error re-running setup: ${e}`});
    }
  };
};
