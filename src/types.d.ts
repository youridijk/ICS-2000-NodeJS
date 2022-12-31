import Hub from './kaku/Hub';
import Device from './kaku/devices/Device';

declare global {
    namespace Express {
        interface Request {
            hub: Hub;
            device: Device;
            sendCommandsLocal: boolean;
        }
    }
}
