import express, {Express, Router} from 'express';
import Hub from '../kaku/Hub';
import CheckNumber from './middlewares/CheckNumber';
import CheckGetDevice from './middlewares/CheckGetDevice';
import Setup from './routes/RerunSetup';
import GETDevices from './routes/control/GETDevices';
import GETDevice from './routes/control/GETDevice';
import GETDeviceStatus from './routes/control/GETDeviceStatus';
import PUTDeviceStatus from './routes/control/PUTDeviceStatus';
import PUTOnOff from './routes/control/PUTOnOff';
import StaticHub from './middlewares/StaticHub';
import DynamicHub from './middlewares/DynamicHub';
import GETCurrentSmartMeterData from './routes/smartmeter/GETCurrentSmartmeterData';

export default class RESTServer {
  protected readonly app: Express = express();
  public readonly router: Router = Router();

  constructor(
    public readonly hub?: Hub,
  ) {
    this.setupRoutes();
  }

  private setupRoutes() {
    if (this.hub) {
      this.router.use(StaticHub(this.hub));
      this.router.post('/setup', Setup(this));
    } else {
      this.router.use(DynamicHub);
    }

    this.router.use(express.json());

    this.router.get('/smartmeter/current', GETCurrentSmartMeterData);

    this.router.get('/devices', GETDevices);
    this.router.get('/devices/:entityId', CheckNumber, CheckGetDevice, GETDevice);
    this.router.get('/devices/:entityId/status', [CheckNumber, CheckGetDevice], GETDeviceStatus);
    this.router.put('/devices/:entityId/status', CheckNumber, CheckGetDevice, PUTDeviceStatus);
    this.router.put(['/devices/:entityId/status/on', '/devices/:entityId/status/off'], CheckNumber, CheckGetDevice, PUTOnOff);
    this.router.put('/devices/:entityId/status/:dimLevel', CheckNumber, CheckGetDevice);
    this.app.use(this.router);
  }

  public async setup() {
    if (!this.hub) {
      return;
    }

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
      this.app.listen(port, hostname, resolve);
    });
  }
}

module.exports = RESTServer;
