import express, {Express, Router} from 'express';
import Hub from '../kaku/Hub';
import CheckNumber from './middlewares/CheckNumber';
import CheckGetDevice from './middlewares/CheckGetDevice';
import Setup from './routes/RerunSetup';
import GETSmartmeterData from './routes/GETSmartmeterData';
import GETDevices from './routes/GETDevices';
import GETDevice from './routes/GETDevice';
import GETDeviceStatus from './routes/GETDeviceStatus';
import PUTDeviceStatus from './routes/PUTDeviceStatus';
import PUTOnOff from './routes/PUTOnOff';

export default class RESTServer {
  protected readonly app: Express = express();
  public readonly router: Router = Router();

  constructor(
    public readonly hub: Hub,
  ) {
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.use(express.json());

    this.router.post('/setup', Setup(this));
    this.router.get('/smartmeter', GETSmartmeterData(this.hub));

    this.router.get('/devices', GETDevices(this.hub));
    this.router.get('/devices/:entityId', CheckNumber, CheckGetDevice(this.hub), GETDevice);
    this.router.get('/devices/:entityId/status', [CheckNumber, CheckGetDevice(this.hub)], GETDeviceStatus);
    this.router.put('/devices/:entityId/status', CheckNumber, CheckGetDevice(this.hub), PUTDeviceStatus);
    this.router.put(['/devices/:entityId/status/on', '/devices/:entityId/status/off'], CheckNumber, CheckGetDevice(this.hub), PUTOnOff);
    this.router.put('/devices/:entityId/status/:dimLevel', CheckNumber, CheckGetDevice(this.hub));
    this.app.use(this.router);
  }


  public async setup() {
    await this.hub.login();
    // console.log('Logged in');
    await this.hub.discoverHubLocal();
    // console.log('Discovered hub');
    await this.hub.pullDevices();
    // console.log('Pulled devices');
    await this.hub.getAllDeviceStatuses();
    // console.log('Got all statuses');
  }

  public listen(port: number, hostname = '0.0.0.0'): Promise<void> {
    return new Promise<void>((resolve) => {
      // if (!this.hub.isReady()) {
      //   return reject('Hub isn\'t ready!')
      // }

      this.app.listen(port, hostname, resolve);
    });
  }
}

module.exports = RESTServer;
