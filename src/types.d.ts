import Hub from './kaku/Hub';
import Entity from './kaku/entities/Entity';

declare global {
    namespace Express {
        interface Request {
            hub: Hub;
            device: Entity;
            sendCommandsLocal: boolean;
        }
    }
}
